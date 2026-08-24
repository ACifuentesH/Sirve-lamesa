import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Routing
import { AppRoutingModule } from './app-routing.module';

// Components (standalone)
import { AppComponent } from './app.component';

// Las pantallas del flujo son standalone e importan sus propias dependencias
// (formularios incluidos), así que este módulo ya solo arranca la aplicación.
// Los servicios son `providedIn: 'root'` y no necesitan declararse aquí.
@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    AppComponent  // Import standalone component instead of declaring
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
