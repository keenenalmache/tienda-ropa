import { Component, HostListener, inject } from '@angular/core';
import { Dialogos } from '../../services/dialogos';

@Component({
  selector: 'app-dialogo',
  templateUrl: './dialogo.html',
  styleUrl: './dialogo.css',
})
export class Dialogo {
  d = inject(Dialogos);

  @HostListener('document:keydown.escape')
  escape() {
    if (this.d.estado()) this.d.responder(false);
  }
}