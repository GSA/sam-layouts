import '@angular/compiler';
import { FormControl, FormGroup } from '@angular/forms';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { FormlyModule, FormlyForm } from '@ngx-formly/core';
import { SdsFormlyModule } from '@gsa-sam/sam-formly';
import { Subject } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { LayoutResponsiveComponent } from './layout-responsive.component';

function createComponent(fields: any[]) {
  const filterService: any = {
    fields,
    model: {},
    form: new FormGroup({}),
    options: {},
    keywordChangeSubject: new Subject(),
  };

  return {
    component: new LayoutResponsiveComponent({} as any, filterService, {} as any, {} as any),
    filterService,
  };
}

@Component({
  standalone: true,
  imports: [FormlyForm],
  template: '<formly-form [form]="form" [fields]="fields" [model]="model"></formly-form>',
})
class FormlyTabsHostComponent {
  form = new FormGroup({});
  model: any = {};
  fields: any[] = [
    {
      key: 'keyword',
      wrappers: ['tabs'],
      fieldGroup: [
        {
          props: { tabHeader: 'Simple Search' },
          fieldGroup: [
            {
              key: 'keywordRadio',
              type: 'radio',
              defaultValue: 'anyWords',
              props: {
                options: [
                  { label: 'Any', value: 'anyWords' },
                  { label: 'All', value: 'allWords' },
                ],
              },
            },
          ],
        },
        {
          props: { tabHeader: 'Search Editor' },
          fieldGroup: [{ key: 'keywordTextarea', type: 'textarea' }],
        },
      ],
    },
  ];
}

describe('Formly tabs configuration', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [FormlyModule.forRoot(), SdsFormlyModule.forChild(), FormlyTabsHostComponent],
      providers: [provideNoopAnimations()],
    });
    await TestBed.compileComponents();
  });

  it('creates the real Formly form and keeps radio and editor controls in separate tabs', () => {
    const fixture = TestBed.createComponent(FormlyTabsHostComponent);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const keyword = host.form.get('keyword') as unknown as FormGroup;

    expect(keyword).toBeTruthy();
    expect(keyword.get('keywordRadio')?.value).toBe('anyWords');
    expect(keyword.get('keywordTextarea')).toBeTruthy();

    keyword.get('keywordRadio')?.setValue('allWords');
    keyword.get('keywordTextarea')?.setValue('expression');
    expect(keyword.getRawValue()).toEqual({ keywordRadio: 'allWords', keywordTextarea: 'expression' });
  });
});

describe('LayoutResponsiveComponent keyword radio lifecycle', () => {
  it('does not require the lazy filter control during parent initialization', () => {
    const fields = [{ key: 'keyword', fieldGroup: [] }];
    const { component } = createComponent(fields);

    expect(() => component.ngOnInit()).not.toThrow();
  });

  it('patches the partial keyword payload before updating search results', () => {
    const { component, filterService } = createComponent([]);
    const keyword = new FormGroup({
      keywordRadio: new FormControl('anyWords'),
      keywordTags: new FormControl([]),
      keywordExactPhrase: new FormControl('preserved'),
      keywordTextarea: new FormControl('editor text'),
    });
    filterService.form.addControl('keyword', keyword);
    component.ngOnInit();
    component.resultList = { updateSearchResultsModel: vi.fn() };

    expect(() => component.onSearchModelUpdate()).not.toThrow();
    expect(keyword.get('keywordRadio')?.value).toBe('allWords');
    expect(keyword.get('keywordExactPhrase')?.value).toBe('preserved');
    expect(keyword.get('keywordTextarea')?.value).toBe('editor text');
    expect(component.resultList.updateSearchResultsModel).toHaveBeenCalledOnce();
  });

  it('restores shared hooks on destroy so a recreated component does not subscribe twice', async () => {
    const originalAfterViewInit = vi.fn();
    const originalOnDestroy = vi.fn();
    const originalHooks = { afterViewInit: originalAfterViewInit, onDestroy: originalOnDestroy };
    const radioField: any = { key: 'keywordRadio', hooks: originalHooks };
    const fields = [{ key: 'keyword', fieldGroup: [{ fieldGroup: [radioField] }] }];
    const { component: first, filterService } = createComponent(fields);
    const refresh = vi.spyOn(filterService.keywordChangeSubject, 'next');
    radioField.formControl = new FormControl('anyWords');
    first.ngOnInit();
    radioField.hooks.afterViewInit(radioField);
    first.ngOnDestroy();
    expect(radioField.hooks).toBe(originalHooks);

    const second = new LayoutResponsiveComponent({} as any, filterService, {} as any, {} as any);
    second.ngOnInit();
    radioField.hooks.afterViewInit(radioField);
    radioField.formControl.setValue('allWords');
    await Promise.resolve();

    expect(originalAfterViewInit).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(1);
    second.ngOnDestroy();
    expect(radioField.hooks).toBe(originalHooks);
    expect(originalOnDestroy).not.toHaveBeenCalled();
  });

  it('refreshes autocomplete when the lazily-created radio control changes', async () => {
    const radioField: any = { key: 'keywordRadio' };
    const fields = [
      {
        key: 'keyword',
        fieldGroup: [{ fieldGroup: [radioField] }],
      },
    ];
    const { component, filterService } = createComponent(fields);
    const refresh = vi.spyOn(filterService.keywordChangeSubject, 'next');
    const control = new FormControl('anyWords');

    component.ngOnInit();
    radioField.formControl = control;
    radioField.hooks.afterViewInit(radioField);
    control.setValue('allWords');
    await Promise.resolve();

    expect(refresh).toHaveBeenCalledWith({});

    radioField.hooks.onDestroy(radioField);
    refresh.mockClear();
    control.setValue('anyWords');
    await Promise.resolve();
    expect(refresh).not.toHaveBeenCalled();
  });
});
