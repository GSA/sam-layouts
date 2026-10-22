import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdsFeedbackComponent } from './sds-feedback.component';
import { SdsFeedbackModule } from './sds-feedback.module';

describe('SdsFeedbackComponent', () => {
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
