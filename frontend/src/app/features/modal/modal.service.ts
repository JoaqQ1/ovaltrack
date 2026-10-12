import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  confirm(_title: string, message: string, _description: string): Promise<boolean> {
    return Promise.resolve(window.confirm(message));
  }
}
