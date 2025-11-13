import { Component } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Products } from '../../models/products';
import { Service } from '../../services/Service.service';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import * as JsBarcode from 'jsbarcode';
import { CommonModule } from '@angular/common';
import { BarcodeDirective } from '../../directive/barcodedirective.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-homescreen',
  standalone: true,
  imports: [FormsModule, CommonModule,BarcodeDirective],
  templateUrl: './homescreen.component.html',
  styleUrl: './homescreen.component.scss',
})
export class HomeScreenComponent {

  products: Products[] = [];
  productCode: string = '';
  errorMessage: string = '';
  isLoading: boolean = true;
  isSubmitting: boolean = false;
  private destroy$ = new Subject<void>();

  constructor(private productService: Service) {}

  ngOnInit(): void {
    this.loadProducts();
    
    // ติดตามสถานะ loading
    this.productService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading: boolean) => {
        this.isLoading = loading;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // โหลดข้อมูลสินค้า
  loadProducts(): void {
    this.productService.getProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (products: Products[]) => {
          this.products = products ?? [];
        },
        error: (error: any) => {
          console.error('Error loading products:', error);
          this.errorMessage = 'ไม่สามารถโหลดข้อมูลสินค้าได้';
        }
      });
  }

  // จัดรูปแบบรหัสสินค้าในขณะพิมพ์
  onProductCodeInput(event: any): void {
    let value = event.target.value.toUpperCase();
    value = value.replace(/[^A-Z0-9-]/g, '');
    
    const formattedValue = this.productService.formatProductCode(value);
    this.productCode = formattedValue;
    this.clearError();
  }

  // เพิ่มสินค้า
addProduct(): void {
  if (!this.productCode.trim()) {
    this.errorMessage = 'กรุณากรอกรหัสสินค้า';
    return;
  }

  if (!this.productService.validateProductCode(this.productCode)) {
    this.errorMessage = 'รูปแบบรหัสสินค้าไม่ถูกต้อง ต้องเป็น XXXX-XXXX-XXXX-XXXX โดย X เป็นตัวเลขหรือตัวอักษรภาษาอังกฤษพิมพ์ใหญ่';
    return;
  }

  // ตรวจสอบว่ารหัสสินค้าซ้ำหรือไม่
  if (this.products?.length && this.products.some(product => product.product_code === this.productCode)) {
    this.errorMessage = 'รหัสสินค้านี้มีอยู่แล้วในระบบ';
    return;
  }

  this.isSubmitting = true;

  const newProduct: Partial<Products> = {
    product_code: this.productCode,
    barcode: this.productCode,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  this.productService.createProduct(newProduct)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (product: Products) => {
        this.products = this.products ?? [];
        this.products.unshift(product);

        this.productCode = '';
        this.clearError();
        this.isSubmitting = false;

        // ⭐ SweetAlert2 แสดงผลลัพธ์สวย ๆ
        Swal.fire({
          icon: 'success',
          title: 'เพิ่มสินค้าเรียบร้อย!',
          text: 'สินค้าได้ถูกเพิ่มเข้าสู่ระบบแล้ว',
          confirmButtonText: 'ตกลง',
        });
      },
      error: (error: any) => {
        console.error('Error creating product:', error);
        this.errorMessage = 'ไม่สามารถเพิ่มสินค้าได้';
        this.isSubmitting = false;

        // SweetAlert เมื่อเกิดข้อผิดพลาด
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด',
          text: 'ไม่สามารถเพิ่มสินค้าได้ กรุณาลองใหม่อีกครั้ง',
          confirmButtonText: 'ตกลง',
        });
      }
    });
}


  // ลบสินค้า
 deleteProduct(product: Products): void {
  Swal.fire({
    title: 'คุณแน่ใจหรือไม่?',
    text: "ต้องการลบสินค้านี้ใช่หรือไม่?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบสินค้า',
    cancelButtonText: 'ยกเลิก',
    reverseButtons: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
  }).then((result) => {
    if (result.isConfirmed) {

      this.productService.deleteProduct(product.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.products = this.products.filter(p => p.id !== product.id);

            Swal.fire({
              icon: 'success',
              title: 'ลบสินค้าสำเร็จ!',
              showConfirmButton: false,
              timer: 1500
            });
          },
          error: (error: any) => {
            console.error('Error deleting product:', error);

            Swal.fire({
              icon: 'error',
              title: 'ลบสินค้าไม่สำเร็จ',
              text: 'เกิดข้อผิดพลาดขณะลบสินค้า'
            });
          }
        });

    }
  });
}


  // ล้างฟอร์ม
  clearForm(): void {
    this.productCode = '';
    this.clearError();
  }

  // ล้างข้อความ error
  clearError(): void {
    this.errorMessage = '';
  }

  // กด Enter เพื่อเพิ่มสินค้า
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.addProduct();
    }
  }
}
