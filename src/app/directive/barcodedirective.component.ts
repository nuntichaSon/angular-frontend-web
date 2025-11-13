import { Directive, ElementRef, Input, OnInit } from '@angular/core';
import JsBarcode from 'jsbarcode';

@Directive({
  selector: '[appBarcode]',
  standalone: true
})
export class BarcodeDirective implements OnInit {
  @Input() value = '';

  constructor(private el: ElementRef) {}

  ngOnInit() {
    JsBarcode(this.el.nativeElement, this.value, {
      format: 'CODE39',
      lineColor: '#000',
      width: 2,
      height: 50,
      displayValue: false
    });
  }
}
