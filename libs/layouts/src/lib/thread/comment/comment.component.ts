import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { SdsDialogRef, SdsDialogService, SDS_DIALOG_DATA } from '@gsa-sam/components';
import { ToastrService } from 'ngx-toastr';
import { CommentEntity } from '../thread.service';




@Component({
  selector: 'comment',
  templateUrl: 'comment.component.html'
})
export class CommentComponent implements OnInit {
  CommentMode = CommentMode;
  ngOnInit(): void {

  }
  characterCountShowMore: number = 200;
  showMore: boolean = false;

  @Input() comment: CommentEntity;

  @Output() deleteCommentEvent: EventEmitter<CommentEntity> = new EventEmitter<CommentEntity>();

  @Output() editCommentEvent: EventEmitter<CommentEntity> = new EventEmitter<CommentEntity>();


  commmentMode = CommentMode.READ;

  model = { commentField: '' };


  constructor(public dialog: SdsDialogService) { }

  showMoreClick() {
    this.showMore = true;
  }

  showLessClick() {
    this.showMore = false;
  }

  getDateFormat(date2) {
    let date = new Date(date2);
    return this.getWordMonth(date.getMonth()) + ' ' + date.getDate() + ', ' + date.getFullYear() + ' at ' + (date.getHours() % 12) + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes() + (date.getHours() >= 12 ? 'PM' : 'AM');
  }

  getWordMonth(num: number) {

    let monthTxt = '';
    //off by one
    switch (num + 1) {
      case 1:
        monthTxt = 'January';
        break;
      case 2:
        monthTxt = 'February';
        break;
      case 3:
        monthTxt = 'March';
        break;
      case 4:
        monthTxt = 'April';
        break;
      case 5:
        monthTxt = 'May';
        break;
      case 6:
        monthTxt = 'June';
        break;
      case 7:
        monthTxt = 'July';
        break;
      case 7:
        monthTxt = 'August';
        break;
      case 8:
        monthTxt = 'September';
        break;
      case 10:
        monthTxt = 'October';
        break;
      case 11:
        monthTxt = 'November';
        break;
      case 12:
        monthTxt = 'December';
        break;
      default:
        break;
    }
    return monthTxt;
  }

  editComment() {
    this.model.commentField = this.comment.comment;
    this.commmentMode = CommentMode.UPDATE;
  }

  saveEditComment() {
    this.comment.comment = this.model.commentField;
    this.editCommentEvent.emit(this.comment);
    this.commmentMode = CommentMode.READ;
  }

  deleteComment() {
    this.openDeleteModal();

  }

  cancelEditComment() {
    this.commmentMode = CommentMode.READ;
  }

  openDeleteModal() {
    const deleteDialog = this.dialog.open(AlertComponent, {
      alert: 'warning',
      width: 'Small',
      data: {},
    });

    deleteDialog.afterClosed().subscribe(result => this.deleteModalClosed(result)
    );
  }

  deleteModalClosed(result) {
    if (result.deleteStatus) {
      this.deleteCommentEvent.emit(this.comment);
    }
  }


}


export interface AlertData {
  title: string;
  content: string;
}

/**
 * ALERTS
 * ================================================
 */
// Error
@Component({
  selector: 'dialog-alert',
  template: `

  <div sds-dialog-title>Are you sure you want to delete this comment?</div>
<div class="padding-bottom-2"> </div>
<div sds-dialog-actions>
  <div class="grid-container">
  <div class="grid-row">
    <div class="grid-col">
      <button (click)="close(false)" class="usa-button usa-button--base">Back</button>
    </div>
    <div class="grid-col">
      <button (click)="close(true)" cdkFocusInitial class="usa-button">Delete</button>
    </div>
  </div>
</div>
</div>
  `,
})
export class AlertComponent {
  constructor(@Inject(SDS_DIALOG_DATA) public data: AlertData, public dialogRef: SdsDialogRef<AlertComponent>,) { }

  close(status: boolean) {
    this.dialogRef.close({ 'deleteStatus': status, });
  }
}

export enum CommentMode { UPDATE, READ }


