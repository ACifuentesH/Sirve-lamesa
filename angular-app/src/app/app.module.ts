import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

// Routing
import { AppRoutingModule } from './app-routing.module';

// Components (standalone)
import { AppComponent } from './app.component';

// Services
import { ApiService } from './services/api.service';
import { AuthService } from './services/auth.service';
import { GameDataService } from './services/game-data.service';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    DragDropModule,
    AppComponent  // Import standalone component instead of declaring
  ],
  providers: [
    ApiService,
    AuthService,
    GameDataService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
