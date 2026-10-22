import '@angular/compiler';
import { FormControl, FormGroup } from '@angular/forms';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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
    });
    await TestBed.compileComponents();
  });

  it('creates the real Formly form and keeps radio and editor controls in separate tabs', () => {
    const fixture = TestBed.createComponent(FormlyTabsHostComponent);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const keyword = host.form.get('keyword') as FormGroup;

    expect(keyword).toBeTruthy();
    expect(keyword.get('keywordRadio')?.value).toBe('anyWords');
    expect(keyword.get('keywordTextarea')).toBeTruthy();

    keyword.get('keywordRadio')?.setValue('allWords');
    keyword.get('keywordTextarea')?.setValue('expression');
    expect(keyword.value).toEqual({ keywordRadio: 'allWords', keywordTextarea: 'expression' });
  });
});

describe('LayoutResponsiveComponent keyword radio lifecycle', () => {
  it('does not require the lazy filter control during parent initialization', () => {
    const fields = [{ key: 'keyword', fieldGroup: [] }];
    const { component } = createComponent(fields);

    expect(() => component.ngOnInit()).not.toThrow();
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
