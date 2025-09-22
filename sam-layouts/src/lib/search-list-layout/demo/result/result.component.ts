import { Component, Input } from '@angular/core';
	@Component({
	standalone: false,
  selector: 'result-item',
  templateUrl: './result.component.html'
})
export class ResultComponent {
  @Input() model: any;
}
