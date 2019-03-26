import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public getToken(): string {
    return localStorage.getItem('token');
  }

  public getUserId(): number {
    const userId = localStorage.getItem('userId');
    return userId ? parseInt(userId, 10) : null;
  }

  public isAuthenticated(): boolean {
    // get the token
    const token = this.getToken();
    // return a boolean reflecting
    // whether or not the token is expired
    return token !== null;
  }

  public setToken(token: any) {
    localStorage.setItem('token', token);
  }

  public setUserId(userId: any) {
    localStorage.setItem('userId', userId);
  }

  public logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
  }
}
