import { FormControl, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
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

describe('LayoutResponsiveComponent keyword radio lifecycle', () => {
  it('does not require the lazy filter control during parent initialization', () => {
    const fields = [{ key: 'keyword', fieldArray: { fieldGroup: [] } }];
    const { component } = createComponent(fields);

    expect(() => component.ngOnInit()).not.toThrow();
  });

  it('refreshes autocomplete when the lazily-created radio control changes', async () => {
    const radioField: any = { key: 'keywordRadio' };
    const fields = [
      {
        key: 'keyword',
        fieldArray: { fieldGroup: [{ fieldGroup: [radioField] }] },
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
