import { Injectable } from '@angular/core';
import { CommentEntity, IThreadService, ThreadEntity } from './thread.service';
import { Observable, of } from 'rxjs';

@Injectable()
export class ThreadMockService implements IThreadService {

  constructor() {

  }

  threadCount = 0;

  threads = {
    "0": [
      new CommentEntity('0', "0", 'Comment', 'Bob', 'Joan', '', true, new Date()), //new Date(2022, 4, 4, 4, 15, 0, 0)),
      new CommentEntity('1', "0", 'Comment', 'Kat', 'Rollins', 'Admin', true, new Date()), //new Date(2022, 4, 4, 4, 15, 0, 0)),
      new CommentEntity('2', "0", 'Comment', 'Bob', 'Joan', '', true, new Date()), // new Date(2022, 4, 4, 4, 15, 0, 0)),
      new CommentEntity('3', "0", 'Comment', 'Kat', 'Rollins', 'Admin',true, new Date()), // true, new Date(2022, 4, 4, 4, 15, 0, 0)),
      new CommentEntity('4', "0", 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean eu justo eros. Aliquam in risus id risus ullamcorper condimentum vel vitae justo. Nam eros risus, dapibus in sapien sed, posuere rutrum ipsum. Nulla facilisi. Duis sit amet ultrices dui. Donec at sagittis risus, ut iaculis turpis. Donec massa libero, viverra sed blandit vel, dapibus ac est.    Phasellus dapibus finibus justo, eu viverra ipsum. Aenean sodales ac neque non volutpat. Donec sit amet massa sed velit consequat maximus turpis.', 'Bob', 'Joan', '', true, new Date()), // new Date(2022, 4, 4, 4, 15, 0, 0))
    ]
  }

  createThread(thread: ThreadEntity): Observable<ThreadEntity> {
    this.threadCount++;
    this.threads[this.threadCount.toString()] = [];
    thread.id = this.threadCount.toString();
    return of(thread);
  }

  createComment(comment: CommentEntity, threadId: string): Observable<CommentEntity> {
    comment.id = this.threads[threadId].length.toString();
    this.threads[threadId].push(comment);
    return of(comment);
  }

  editComment(comment: CommentEntity, commentId: string): Observable<CommentEntity> {
    let comments: CommentEntity[] = this.threads[comment.threadId];
    let comment2 = comments.find(function (ele: CommentEntity) {
      return ele.id === comment.id;
    });
    comment2.comment = comment.comment;
    return of(comment2);
  }

  deleteComment(comment: CommentEntity): Observable<CommentEntity> {
    let comments: CommentEntity[] = this.threads[comment.threadId];
    this.threads[comment.threadId] = comments.filter(function (ele: CommentEntity) {
      return ele.id != comment.id;
    });
    return of(null);
  }

  getComments(threadId: string): Observable<CommentEntity[]> {
    return of(JSON.parse(JSON.stringify(this.threads[threadId])));
  }

  getCommentCount(threadId: string): Observable<number> {

    return of(JSON.parse(JSON.stringify(this.threads[threadId])).length);
  }

}

