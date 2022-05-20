import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
//import { AuthService } from '../auth/auth.service';
import { Observable } from 'rxjs';
import { SystemConfig } from './thread-config-model';
import { timeout } from 'rxjs/operators';

@Injectable()
export class GenericThreadService implements IThreadService {


  constructor(private http: HttpClient,
   //  public authService: AuthService,
      @Inject(SystemConfig) private environment: SystemConfig) {

  }
  createThread(thread: ThreadEntity): Observable<ThreadEntity> {
    throw new Error('Method not implemented.');
  }
  createComment(comment: CommentEntity, threadId:string): Observable<CommentEntity> {
    throw new Error('Method not implemented.');
  }
  editComment(comment: CommentEntity, commentId: string): Observable<CommentEntity> {
    throw new Error('Method not implemented.');
  }
  deleteComment(comment: CommentEntity): Observable<CommentEntity> {
    throw new Error('Method not implemented.');
  }
  getComments(threadId: string): Observable<CommentEntity[]> {
    throw new Error('Method not implemented.');
  }
  getCommentCount(threadId: string): Observable<number> {
    throw new Error('Method not implemented.');
  }


  // _options() {
  //   const params = {};
  //   return {
  //     headers: {
  //       'X-Auth-Token': this.authService.authToken()
  //     },
  //     params: params
  //   };
  // }

  // public createIncident(incident: HelpTicket): Observable<HelpTicketEntity> {
  //   this.loggedIn();
  //   const url = `${this.environment.API_UMBRELLA_URL}/helpdesk/v1/tickets`;
  //   return this.http.post<HelpTicketEntity>(url, incident, this._options());
  // }

  // public getIncident(helpTicketId: string): Observable<HelpTicketEntity> {
  //   this.loggedIn();
  //   const url = `${this.environment.API_UMBRELLA_URL}/helpdesk/v1/tickets/${helpTicketId}`
  //   let op = this._options();
  //   return this.http.get<HelpTicketEntity>(url, op);
  // }

  // public updateIncident(helpTicketEntity: HelpTicketEntity, helpTicketId: string): Observable<HelpTicketEntity> {
  //   this.loggedIn();
  //   const url = `${this.environment.API_UMBRELLA_URL}/helpdesk/v1/tickets/${helpTicketId}`;
  //   let op = this._options();
  //   return this.http.patch<HelpTicketEntity>(url, {
  //     "comments": helpTicketEntity.description
  //   }
  //     , op);
  // }


  // public deleteIncident(helpTicketId: string): Observable<HelpTicketEntity> {
  //   this.loggedIn();
  //   const url = `${this.environment.API_UMBRELLA_URL}/helpdesk/v1/tickets/${helpTicketId}`;
  //   let op = this._options();
  //   return this.http.delete<HelpTicketEntity>(url, op);
  // }

  // public submitIncident(helpTicketId: string, helpTicketEntity: HelpTicketEntity): Observable<HelpTicketEntity> {
  //   this.loggedIn();
  //   const url = `${this.environment.API_UMBRELLA_URL}/helpdesk/v1/tickets/${helpTicketId}/submit`;
  //   let op = this._options();
  //   helpTicketEntity['comments'] = helpTicketEntity.description;
  //   return this.http.post<HelpTicketEntity>(url, helpTicketEntity, op);
  // }

  // public uploadIncidentDocument(helpTicketId: string, file: any): Observable<object> {
  //   this.loggedIn();
  //   let formData: FormData = new FormData();
  //   formData.append('file', file, file.name);
  //   let options = this._options();
  //   options["reportProgress"] = true;
  //   options["responseType"] = 'text';
  //   const url = `${this.environment.API_UMBRELLA_URL}/helpdesk/v1/documents?ticketId=${helpTicketId}`;
  //   return this.http.post(url, formData, options);
  // }

  // public deleteIncidentDocument(documentId: string): Observable<HelpTicketDocument> {
  //   this.loggedIn();
  //   const url = `${this.environment.API_UMBRELLA_URL}/helpdesk/v1/documents/${documentId}`;
  //   let op = this._options();
  //   return this.http.delete<HelpTicketDocument>(url, op);
  // }

  // private loggedIn() {
  //   if (!this.authService.isLoggedIn()) {
  //     throw new Error('Must be authenticated');
  //   }
  // }


}

export class ThreadEntity {
  constructor(public id: string,
    public source: string,
    public sourceId: string
  ) {
  }

}

export class CommentEntity {
  constructor(public id: string,
    public threadId:string,
    public comment: string,
    public firstName: string,
    public lastName: string,
    public role: string,
    public showUser: boolean,
    public createdDate:Date) {

  }
}


export interface IThreadService {
  createThread(thread: ThreadEntity): Observable<ThreadEntity>;
  createComment(comment: CommentEntity, threadId:string): Observable<CommentEntity>
  editComment(comment: CommentEntity, commentId: string): Observable<CommentEntity>
  deleteComment(comment: CommentEntity): Observable<CommentEntity>;
  getComments(threadId: string): Observable<CommentEntity[]>;
  getCommentCount(threadId: string): Observable<number>;

}
