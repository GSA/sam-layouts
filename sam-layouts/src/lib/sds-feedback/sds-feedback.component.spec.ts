import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdsFeedbackComponent } from './sds-feedback.component';
import { SdsFeedbackModule } from './sds-feedback.module';

describe('SdsFeedbackComponent imported directly', () => {
  it('renders both registered icons without its compatibility module', async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, SdsFeedbackComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(SdsFeedbackComponent);
    fixture.detectChanges();

    const icons = fixture.nativeElement.querySelectorAll('usa-icon svg');
    expect(icons.length).toBe(2);
    expect(icons[0].querySelector('path')).not.toBeNull();
    expect(icons[1].querySelector('path')).not.toBeNull();
  });
});

describe('SdsFeedbackComponent via compatibility module', () => {
  let component: SdsFeedbackComponent;
  let fixture: ComponentFixture<SdsFeedbackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ReactiveFormsModule, SdsFeedbackModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SdsFeedbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('Should emit feedback content on submit click', () => {
    component.feedbackModel.setValue('Test Feedback');
    const feedbackSubmitSpy = vi.spyOn(component.feedbackSubmit, 'emit');

    const feedbackSubmitButton = fixture.debugElement.query(By.css('#feedbackSubmit'));
    feedbackSubmitButton.triggerEventHandler('click', null);
    fixture.detectChanges();
    expect(feedbackSubmitSpy).toHaveBeenCalledWith('Test Feedback');
  });
});
