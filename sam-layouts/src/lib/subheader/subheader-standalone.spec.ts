import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SdsDrawerCommunicationService } from './drawer-communication.service';
import { SdsSubheaderDrawerComponent, SdsDrawerContentComponent } from './subheader.component';

@Component({
  imports: [SdsSubheaderDrawerComponent, SdsDrawerContentComponent],
  template: `
    <ng-template #content>Drawer content</ng-template>
    <sds-subheader-drawer [drawerContentTemplate]="content"></sds-subheader-drawer>
    <sds-drawer-content></sds-drawer-content>
  `,
})
class StandaloneDrawerHostComponent {}

describe('standalone drawer and content', () => {
  it('shares the root service and communicates without importing the compatibility module', async () => {
    await TestBed.configureTestingModule({ imports: [StandaloneDrawerHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(StandaloneDrawerHostComponent);
    fixture.detectChanges();

    const drawer = fixture.debugElement.query(By.directive(SdsSubheaderDrawerComponent));
    const content = fixture.debugElement.query(By.directive(SdsDrawerContentComponent));
    const service = TestBed.inject(SdsDrawerCommunicationService);
    expect(drawer.injector.get(SdsDrawerCommunicationService)).toBe(service);
    expect(content.injector.get(SdsDrawerCommunicationService)).toBe(service);
    expect(content.nativeElement.textContent).not.toContain('Drawer content');

    drawer.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(content.nativeElement.textContent).toContain('Drawer content');
    expect(content.componentInstance.isDrawerOpen).toBe(true);

    drawer.nativeElement.querySelector('button').click();
    fixture.detectChanges();
    expect(content.nativeElement.textContent).not.toContain('Drawer content');
    expect(content.componentInstance.isDrawerOpen).toBe(false);
  });
});
