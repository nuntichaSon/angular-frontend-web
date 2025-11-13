import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { Products } from '../models/products';

@Injectable({
  providedIn: 'root',
})
export class Service {
  private apiUrl = 'http://localhost:8080'; // เปลี่ยน URL ตาม API จริง
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ตรวจสอบรูปแบบ Product Code
  validateProductCode(code: string): boolean {
    const regex = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return regex.test(code);
  }

  // จัดรูปแบบ Product Code
  formatProductCode(code: string): string {
    let cleanCode = code.replace(/-/g, '');
    cleanCode = cleanCode.substring(0, 16);
    
    let formattedCode = '';
    for (let i = 0; i < cleanCode.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formattedCode += '-';
      }
      formattedCode += cleanCode[i];
    }
    
    return formattedCode;
  }

  // ดึงสินค้าทั้งหมด
  getProducts(): Observable<Products[]> {
    this.loadingSubject.next(true);
    return this.http.get<Products[]>(`${this.apiUrl}/products`).pipe(
      tap(() => this.loadingSubject.next(false)),
      // new RTCError(this.handleError)
    );
  }

  // ดึงสินค้าตาม ID
  getProduct(id: number): Observable<Products> {
    this.loadingSubject.next(true);
    return this.http.get<Products>(`${this.apiUrl}/products/${id}`).pipe(
      tap(() => this.loadingSubject.next(false)),
      // new RTCError(this.handleError)
    );
  }

  // ค้นหาสินค้าตามรหัส
  searchProductByCode(code: string): Observable<Products> {
    this.loadingSubject.next(true);
    return this.http.get<Products>(`${this.apiUrl}/products/search?product_code=${code}`).pipe(
      tap(() => this.loadingSubject.next(false)),
      catchError(this.handleError)
    );
  }

  // สร้างสินค้าใหม่
  createProduct(product: Partial<Products>): Observable<Products> {
    this.loadingSubject.next(true);
    return this.http.post<Products>(`${this.apiUrl}/products`, product).pipe(
      tap(() => this.loadingSubject.next(false)),
      catchError(this.handleError)
    );
  }

  // อัพเดทสินค้า
  updateProduct(id: number, product: Partial<Products>): Observable<Products> {
    this.loadingSubject.next(true);
    return this.http.put<Products>(`${this.apiUrl}/products/${id}`, product).pipe(
      tap(() => this.loadingSubject.next(false)),
      catchError(this.handleError)
    );
  }

  // ลบสินค้า
  deleteProduct(id: number): Observable<void> {
    this.loadingSubject.next(true); 
    return this.http.delete<void>(`${this.apiUrl}/products/${id}`).pipe(
      tap(() => this.loadingSubject.next(false)),
      catchError(this.handleError)
    );
  }

  // จัดการ error
  private handleError(error: HttpErrorResponse) {
    this.loadingSubject.next(false);
    let errorMessage = 'เกิดข้อผิดพลาดที่ไม่รู้จัก';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `ข้อผิดพลาด: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `รหัสข้อผิดพลาด: ${error.status}\nข้อความ: ${error.message}`;
    }
    
    console.error(errorMessage);
    return throwError(errorMessage);
  }
}
