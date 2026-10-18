import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav aria-label="Page navigation">
      <ul class="pagination pagination-centered">
        <li class="page-item">
          <a class="page-link" (click)="onPageChange(-2)">&laquo;</a>
        </li>
        <li class="page-item">
          <a class="page-link" (click)="onPageChange(-1)">&lsaquo;</a>
        </li>
        <li class="page-item" *ngFor="let t of pages" [class.active]="t === number">
          <a class="page-link" (click)="onPageChange(t + 1)">{{t+1}}</a>
        </li>
        <li class="page-item">
          <a class="page-link" (click)="onPageChange(-3)">&rsaquo;</a>
        </li>
        <li class="page-item">
          <a class="page-link" (click)="onPageChange(-4)">&raquo;</a>
        </li>
      </ul>
    </nav>
  `,
  styles: `
    .pagination {
      display: flex;
      gap: 6px;
      list-style: none;
      padding: 0;
      margin: 20px 0;
      justify-content: center;
      align-items: center;
    }
    
    .page-item {
      display: inline-block;
    }

    .page-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      height: 36px;
      min-width: 36px;
      padding: 0 12px;
      border-radius: 10px;
      background: #ffffff;
      border: 1.5px solid rgba(32, 75, 34, 0.20);
      color: #204b22;
      font-size: 13.5px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
      box-shadow: 0 2px 6px rgba(15, 35, 15, 0.04);
    }

    .page-link:hover {
      background: #edf5e9;
      border-color: #204b22;
      color: #143216;
    }

    .page-item.active .page-link {
      background: #204b22;
      border-color: #204b22;
      color: #ffffff;
      box-shadow: 0 2px 6px rgba(32, 75, 34, 0.25);
    }
  `
})
export class PaginationComponent {
  @Input() totalPages: number = 0;
  @Input() last: boolean = false;
  @Input() currentPage: number = 1;
  @Input() number: number = 1;
  @Output() pageChangeRequested = new EventEmitter<number>();
  pages: number[] = [];

  constructor(){}

  ngOnChanges(changes: SimpleChanges) {
    if(changes['totalPages']) {
      this.pages = Array.from(Array(this.totalPages).keys())
    }
  }

  onPageChange(pageId: number): void {
    if(!this.currentPage) {
      this.currentPage = 1;
    }

    let page = pageId;
    if (pageId === -2) {
      page = 1;
    }

    if (pageId === -1) {
      page = this.currentPage > 1 ? this.currentPage - 1 : 1;
    }
  
    if (pageId === -3) {
      page = !this.last ? this.currentPage + 1 : this.currentPage;
    }
  
    if (pageId === -4) {
      page = this.totalPages;
    }

    if (pageId > 1 && this.pages.length >= pageId) {
      page = this.pages[pageId - 1] + 1;
    }

    if (page > this.totalPages) {
      page = this.totalPages;
    }
    if (page < 1) {
      page = 1;
    }

    this.currentPage = page;
    this.pageChangeRequested.emit(page);

  }
}
