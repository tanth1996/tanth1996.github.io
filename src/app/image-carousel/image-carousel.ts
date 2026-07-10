import { Component, Input, signal } from '@angular/core';

export interface CarouselImage {
  url: string;
  alt: string;
  caption?: string;
}

@Component({
  selector: 'app-image-carousel',
  standalone: true,
  imports: [],
  templateUrl: './image-carousel.html',
  styleUrls: ['./image-carousel.scss'],
})
export class ImageCarousel {
  @Input() images: CarouselImage[] = [];
  @Input() autoPlay = true;
  @Input() displayTime = 5000;

  currentIndex = signal(0);
  private timerId: any = null;

  ngOnInit(): void {
    this.startAutoPlay();
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  nextSlide(): void {
    if (this.images.length === 0) return;
    this.currentIndex.update((index) => (index + 1) % this.images.length);
    this.resetAutoPlay();
  }

  prevSlide(): void {
    if (this.images.length === 0) return;
    this.currentIndex.update((index) => (index - 1 + this.images.length) % this.images.length);
    this.resetAutoPlay();
  }

  goToSlide(index: number): void {
    this.currentIndex.set(index);
    this.resetAutoPlay();
  }

  private startAutoPlay(): void {
    if (this.autoPlay && this.images.length > 1) {
      this.timerId = setInterval(() => {
        this.currentIndex.update((index) => (index + 1) % this.images.length);
      }, this.displayTime);
    }
  }

  private stopAutoPlay(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private resetAutoPlay(): void {
    this.stopAutoPlay();
    this.startAutoPlay();
  }
}
