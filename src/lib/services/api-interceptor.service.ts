import { Injectable, Inject } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, of, from, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { BASE_API_URL } from '../presenter.model';
import { APP_BASE_HREF } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ApiInterceptor implements HttpInterceptor {
  constructor(
    @Inject(BASE_API_URL)
    private baseApiUrl: string,
    @Inject(APP_BASE_HREF)
    private baseHref: string,
    private router: Router,
    private authService: AuthService
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    const apiReq = req.clone({
      // url: `${this.baseHref}/${this.baseApiUrl}/${req.url}${token ? '?token=' + token : ''}`
      url: `${this.baseApiUrl}/${req.url}${token ? '?token=' + token : ''}`
    });
    return next.handle(apiReq).pipe(
      catchError(err => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401) {
            this.router.navigateByUrl('/login');
          }
        }
        return throwError(err);
      })
    );
  }
}
