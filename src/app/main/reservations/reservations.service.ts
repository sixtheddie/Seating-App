import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Subject } from "rxjs";
import { map } from "rxjs/operators";
import { Router } from "@angular/router";

import { environment } from "../../../environments/environment";
import { Reservation } from "./reservation.model";
import { NONE_TYPE } from "@angular/compiler/src/output/output_ast";
import { Store } from "../manager/store/store.model";

const BACKEND_URL = environment.apiUrl + "/reservations/";

@Injectable({ providedIn: "root" })
export class ReservationsService {
  reservations: Reservation[] = [];
  reservationsUpdated = new Subject<{
    reservations: Reservation[];
    reservationCount: number;
  }>();

  userIsAuthenticated = false;
  selectedStoreID = "None";
  selectedResID = "None";

  constructor(private http: HttpClient, private router: Router) {}

  getReservations() {
    this.http
      .get<{ message: string; reservations: any; maxReservations: number }>(
        BACKEND_URL
      )
      .pipe(
        map(reservationData => {
          return {
            reservations: reservationData.reservations.map(reservation => {
              return {
                name: reservation.name,
                size: reservation.size,
                phone: reservation.phone,
                time: reservation.time,
                date: reservation.date,
                notes: reservation.notes,
                id: reservation._id,
                creator: reservation.creator,
                store: reservation.store,
                status: reservation.status
              };
            }),
            maxReservations: reservationData.maxReservations
          };
        })
      )
      .subscribe(transformedReservationData => {
        this.reservations = transformedReservationData.reservations;
        this.reservationsUpdated.next({
          reservations: [...this.reservations],
          reservationCount: transformedReservationData.maxReservations
        });
      });
  }

  getReservationUpdateListener() {
    return this.reservationsUpdated.asObservable();
  }

  getReservation(id: string) {
    return this.http.get<{
      _id: string;
      name: string;
      size: number;
      phone: string;
      time: string;
      date: string;
      notes: string;
      creator: string;
      store: string;
      status: string;
    }>(BACKEND_URL + id);
  }

  addReservation(
    name: string,
    size: number,
    phone: string,
    time: string,
    date: string,
    notes: string,
    store: string,
  ) {

    console.log("STORE: " + store);
    const reservationData: Reservation = {
      id: null,
      name: name,
      size: size,
      phone: phone,
      time: time,
      date: date,
      notes: notes,
      creator: null,
      store: store,
      status: "New"
    };
    this.http
      .post<{ message: string; reservation: Reservation; store: Reservation }>(
        BACKEND_URL,
        reservationData
      )
      .subscribe(responseData => {
        this.router.navigate(["/main/reservations"]);
      });
  }

  updateReservation(
    id: string,
    name: string,
    size: number,
    phone: string,
    time: string,
    date: string,
    notes: string,
    store: string,
    status: string
  ) {
    let reservationData: Reservation | FormData;
    if (0 === 0) {
      reservationData = {
        id: id,
        name: name,
        size: size,
        phone: phone,
        time: time,
        date: date,
        notes: notes,
        creator: null,
        store: store,
        status: status
      };
    }
    return this.http.put(BACKEND_URL + id, reservationData);

  }

  setResID(resID) {
    this.selectedResID = resID;
  }

  deleteReservation(reservationId: string) {
    return this.http.delete(BACKEND_URL + reservationId);
  }
}
