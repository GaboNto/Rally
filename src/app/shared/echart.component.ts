import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import * as echarts from 'echarts';
@Component({selector:'app-echart',standalone:true,template:'<div #chart class="chart" role="img" [attr.aria-label]="label"></div>',styles:[':host{display:block;width:100%;height:100%;min-height:220px}.chart{width:100%;height:100%;min-height:220px}']})
export class EchartComponent implements AfterViewInit,OnChanges,OnDestroy{
  @ViewChild('chart',{static:true})element!:ElementRef<HTMLElement>;@Input({required:true})option:any;@Input()label='Gráfico de datos';private chart?:echarts.ECharts;private observer?:ResizeObserver;
  ngAfterViewInit(){this.chart=echarts.init(this.element.nativeElement);this.chart.setOption(this.option);this.observer=new ResizeObserver(()=>this.chart?.resize());this.observer.observe(this.element.nativeElement)}
  ngOnChanges(c:SimpleChanges){if(c['option']&&this.chart)this.chart.setOption(this.option,true)}ngOnDestroy(){this.observer?.disconnect();this.chart?.dispose()}
}
