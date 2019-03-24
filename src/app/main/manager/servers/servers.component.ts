import { Component, Inject, OnInit, OnDestroy, Input } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { ActivatedRoute, ParamMap } from "@angular/router";
import { Subscription } from "rxjs";

import { ServersService } from "./servers.service";
import { Server } from "./server.model";
import { AuthService } from "../../../auth/auth.service";

import { StoresService } from "../store/stores.service";
import { Store } from "../store/store.model";

/**
 * Color data type for server colors. Includes a name and a hex code.
 */
export interface Color {
  name: string;
  hex: string;
}

@Component({
  selector: 'app-servers',
  templateUrl: './servers.component.html',
  styleUrls: ['./servers.component.css']
})
export class ServersComponent implements OnInit, OnDestroy {
  editServerID = "none";
  servers: Server[] = [];
  isLoading = false;
  totalServers = 0;
  userIsAuthenticated = false;
  userId: string;
  private serversSub: Subscription;
  private authStatusSub: Subscription;

  constructor(
    public dialog: MatDialog,
    public serversService: ServersService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.isLoading = true;
    this.serversService.getServers();
    this.userId = this.authService.getUserId();
    this.serversSub = this.serversService
      .getServerUpdateListener()
      .subscribe(
        (serverData: {
          servers: Server[];
        }) => {
          this.isLoading = false;
          this.servers = serverData.servers;
        }
      );
    this.userIsAuthenticated = this.authService.getIsAuth();
    this.authStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe(isAuthenticated => {
        this.userIsAuthenticated = isAuthenticated;
        this.userId = this.authService.getUserId();
      });
  }

  ngOnDestroy() {
    this.serversSub.unsubscribe();
    this.authStatusSub.unsubscribe();
  }

  openAddServer(): void {
    const dialogRef = this.dialog.open(ServersAddComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }
  openEditServer(id: string): void {
    this.serversService.setServerToEdit(id);
    const dialogRef = this.dialog.open(ServersEditComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

}

@Component({
  selector: 'app-servers-add',
  templateUrl: 'servers-add.component.html',
  styleUrls: ['./servers.component.css']
})
export class ServersAddComponent implements OnInit, OnDestroy {
  enteredName = "";
  enteredStore = "";
  server: Server;
  isLoading = false;
  form: FormGroup;
  private serverId: string;
  private storeId: string;
  private storesSub: Subscription;
  private authStatusSub: Subscription;

  store: Store;
  storeList: Store[] = [];
  selectedStore = "None";
  selectedStoreID = "None";
  totalStores = 0;

  userIsAuthenticated = false;
  userId: string;

  colors: Color[] = [
    {name: "Red", hex: "#FF0000"},
    {name: "Blue", hex: "#0000FF"},
    {name: "Green", hex: "#00FF00"},
    {name: "Purple", hex: "#FF00FF"},
    {name: "Cyan", hex: "#00FFFF"},
    {name: "Yellow", hex: "#FFFF00"}
  ];

  constructor(
    public dialogRef: MatDialogRef<ServersAddComponent>,
    public serversService: ServersService,
    public storesService: StoresService,
    public route: ActivatedRoute,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.isLoading = true;
    this.storesService.getStores();
    this.userId = this.authService.getUserId();
    this.storesSub = this.storesService
      .getStoreUpdateListener()
      .subscribe(
        (storeData: {
          stores: Store[];
          storeCount: number;
        }) => {
          this.isLoading = false;
          this.totalStores = storeData.storeCount;
          this.storeList = storeData.stores;
        }
      );
    this.userIsAuthenticated = this.authService.getIsAuth();
    this.authStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe(authStatus => {
        this.isLoading = false;
      });
    this.form = new FormGroup({
      name: new FormControl(null, {
        validators: [Validators.required]
      }),
      color: new FormControl(null, {
        validators: [Validators.required]
      })
    });
    this.serverId = null;
  }

  onSaveServer() {
    if (this.form.invalid) {
      return;
    }
    console.log("Server color: " + this.form.value.color);
    console.log("Server store: " + this.selectedStoreID + ",  " + this.selectedStore);
    this.isLoading = true;
    this.serversService.addServer(
      this.form.value.name,
      this.form.value.color,
      this.selectedStoreID
    ).subscribe(
      () => {
        this.serversService.getServers();
      }
    );
    this.isLoading = false;
    this.form.reset();
    this.dialogRef.close();
  }

  setServerStore(name: string, storeID: string) {
    this.selectedStore = name;
    this.selectedStoreID = storeID;
  }

  ngOnDestroy() {
    this.authStatusSub.unsubscribe();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}

@Component({
  selector: 'app-servers-edit',
  templateUrl: 'servers-edit.component.html',
  styleUrls: ['./servers.component.css']
})
export class ServersEditComponent implements OnInit, OnDestroy {
  serverToEdit = "none";
  enteredName = "";
  enteredStore = "";
  server: Server;
  isLoading = false;
  form: FormGroup;
  private mode = "edit";
  private serverId: string;
  private storeId: string;
  private storesSub: Subscription;
  private authStatusSub: Subscription;

  store: Store;
  storeList: Store[] = [];
  selectedStore = "None";
  selectedStoreID = "None";
  totalStores = 0;
  currentPage = 1;

  userIsAuthenticated = false;
  userId: string;

  // Color variable used for picking server color
  colors: Color[] = [
    {name: "Red", hex: "#FF0000"},
    {name: "Blue", hex: "#0000FF"},
    {name: "Green", hex: "#00FF00"},
    {name: "Purple", hex: "#FF00FF"},
    {name: "Cyan", hex: "#00FFFF"},
    {name: "Yellow", hex: "#FFFF00"}
  ];

  constructor(
    public dialogRef: MatDialogRef<ServersEditComponent>,
    public serversService: ServersService,
    public storesService: StoresService,
    public route: ActivatedRoute,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.serverToEdit = this.serversService.getServerToEdit();
    console.log(this.serverToEdit);
    this.storesService.getStores();
    this.userId = this.authService.getUserId();
    this.storesSub = this.storesService
      .getStoreUpdateListener()
      .subscribe(
        (storeData: {
          stores: Store[];
          storeCount: number;
        }) => {
          this.isLoading = false;
          this.totalStores = storeData.storeCount;
          this.storeList = storeData.stores;
        }
      );
    this.userIsAuthenticated = this.authService.getIsAuth();
    this.authStatusSub = this.authService
      .getAuthStatusListener()
      .subscribe(authStatus => {
        this.isLoading = false;
      });
    this.form = new FormGroup({
      name: new FormControl(null, {
        validators: [Validators.required]
      }),
      color: new FormControl(null, {
        validators: [Validators.required]
      })
    });
    this.serverId = this.serverToEdit;
    this.isLoading = true;
    this.serversService
      .getServer(this.serverId)
      .subscribe(serverData => {
        this.isLoading = false;
        this.server = {
          id: serverData._id,
          name: serverData.name,
          color: serverData.color,
          store: serverData.store,
          creator: serverData.creator
        };
        this.form.setValue({
          name: this.server.name,
          color: this.server.color
        });
      });
  }

  onUpdateServer() {
    if (this.form.invalid) {
      return;
    }
    console.log(this.form.value.color);
    this.serverId = this.serverToEdit;
    this.isLoading = true;
      this.serversService.updateServer(
        this.serverId,
        this.form.value.name,
        this.form.value.color,
        this.selectedStoreID
    ).subscribe(
      () => {
        this.serversService.getServers();
      }
    );
    this.isLoading = false;
    this.dialogRef.close();
    this.form.reset();
  }

  setServerStore(name: string, storeID: string) {
    this.selectedStore = name;
    this.selectedStoreID = storeID;
  }

  onDelete() {
    this.isLoading = true;
    this.serversService.deleteServer(this.serverToEdit).subscribe(
      () => {
        this.serversService.getServers();
        this.isLoading = false;
        this.dialogRef.close();
      }
    );
  }

  ngOnDestroy() {
    this.authStatusSub.unsubscribe();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
