# AddressBook_FrontEnd

## Overview

_this is a front-end SPA which consume BE CRUD functionalities and display addresses on map. If address record has a physical address, it will be geocoded to a map point._

All Addresses could be geocoded inside Austeria region. 


## Features

- Get all adresses and display them on grid with action buttons (delete, zoom).
- Process returned addresses and geocode only data with physical address field.
- Display addresses on map with marker icon (active, inactive).
- Edit Address data.
- Add new addrress.
- Delete ana addresss.

## Technologies

- Esri Javascript Api 3.18
- Dojo
- Jquery
- Kendo UI

## User Guide

- All Addresses will be loaded on grid and map upon open application.
![](https://s16.postimg.org/5rik49tlh/screen.png)

- Click on an address map icon to view infow window filled with address data and two action buttons (Edit, Delete)
![](https://s16.postimg.org/ssux4gds5/screen3.png)

- Click on edit button to open edit form in left side, marker icon will be converted to edit state
- Press Save to save updates through api and it will reflect on application
- Press Cancel to cancel edits and marker icon will returned to active state again
![](https://s16.postimg.org/snhdri5z9/screen2.png)

- Dounle-click on map within "Austria" zone to add new address
- New marker with edit state will be added on map
- Add form will be opened in left side to add address fields
- Press Save to add new address through api and it will reflect on application
- Press Cancel to cancel adding and remove marker from map
![](https://s10.postimg.org/667pmbbs9/screen4.png)

- Click on home button to retern to default extent
- Type on search area to search through world data
- Use Grid to filter, sort and group addresses
- Zoom or delete from grid action buttons

## Note
- This Application is deployed via azure deployment services (Trial Account), Subscribtions will end on 24/10/2016
