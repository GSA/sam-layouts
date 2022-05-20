import { Component, Input, OnInit, Output, TemplateRef, EventEmitter, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { IThreadService, GenericThreadService, CommentEntity, ThreadEntity } from './thread.service';
import { ThreadMockService } from './thread-mock.service';
import { SdsDialogRef, SdsDialogService } from '@gsa-sam/components';



@Component({
  selector: 'thread',
  templateUrl: 'thread.component.html'
})
export class GenericThreadComponent implements OnInit {

  @Input() threadId: string;// = '0';

  @Input() source: string;

  @Input() sourceId: string;

  @Input() role: string;

  @Input() serviceOveride: IThreadService;

  @Output() threadCreated: EventEmitter<string> = new EventEmitter<string>();

  @ViewChild('templateRef') ref: TemplateRef<any>;

  private service: IThreadService;


  openedDialogRef: SdsDialogRef<any>;

  commentCount = 0;

  comments: CommentEntity[];

  model = { commentField: '' };

  expandedText = false;

  expandTextBox: boolean = false;

  colapse() {
    this.expandTextBox = false;
  }

  expand() {
    this.expandTextBox = true;
  }

  constructor(private threadService: ThreadMockService, public dialog: SdsDialogService
    //,public toastr: ToastrService
  ) {

  }



  ngOnInit(): void {

    if(this.serviceOveride){
      this.service= this.serviceOveride;
    }else{
      this.service = this.threadService;
    }

    if (this.threadId) {
      this.getCommentCount();
    }
  }


  private getCommentCount() {
    this.service.getCommentCount(this.threadId).subscribe((commentCount: number) => {
      this.commentCount = commentCount;
    },
      err => {
        console.error(err);
      }
    );
  }

  saveComment() {
    let comment = new CommentEntity(null, this.threadId, this.model.commentField, 'User', 'LUser', this.role, true, new Date());

    this.service.createComment(comment, this.threadId).subscribe((comment: CommentEntity) => {
      this.comments.push(comment);
      this.commentCount = this.comments.length;
      this.model.commentField = '';

    },
      err => {
        console.error(err);
        // this.toastr.error('Comments could not be loaded', "");
      },
    );
  }


  deleteComment(comment: CommentEntity) {
    let comment2 = comment;
    this.service.deleteComment(comment).subscribe((comment: CommentEntity) => {
      this.comments = this.comments.filter(function (ele: CommentEntity) {
        return ele.id != comment2.id;
      });
      this.commentCount = this.comments.length;
    },
      err => {
        console.error(err);
        // this.toastr.error('Comments could not be loaded', "");
      },
    );
  }

  editComment(comment: CommentEntity) {
    let comment2 = comment;
    this.service.editComment(comment, comment.id).subscribe((comment: CommentEntity) => {

      let commentFound: CommentEntity = this.comments.find(element => element.id === comment2.id);
      commentFound.comment = comment2.comment;

    },
      err => {
        console.error(err);
        // this.toastr.error('Comments could not be loaded', "");
      },
    );
  }


  buttonClicked() {
    if (!this.openedDialogRef) {
      if (this.threadId) {
        this.getComments();
      } else {
        this.createNewThread();
      }
    }
    else {
      this.openedDialogRef.close();
      this.openedDialogRef = null;
    }
  }

  private createNewThread() {
    const thread = new ThreadEntity(null, this.source, this.sourceId);
    this.service.createThread(thread).subscribe((threadRtn: ThreadEntity) => {
      this.threadId = threadRtn.id;
      this.comments = [];
      this.commentCount = 0;
      this.openCloseSlideOut();
      this.threadCreated.emit(this.threadId);
    },
      err => {
        console.error(err);
      }
    );
  }



  private getComments() {
    this.service.getComments(this.threadId).subscribe((comments: CommentEntity[]) => {
      this.comments = comments;
      this.commentCount = comments.length;
      this.openCloseSlideOut();
    },
      err => {
        console.error(err);
      }
    );
  }

  private openCloseSlideOut() {

    this.openedDialogRef = this.dialog.open(this.ref, {
      hasBackdrop: false,
      height: '100%',
      position: { right: 'true' },
      slideOut: {
        width: '20rem',
        time: '350ms',
      },
    });

  }
}

