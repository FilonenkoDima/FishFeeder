# FishFeeder Project

## What is the project about?
FishFeeder is a smart device project designed to automate the feeding of fish in aquariums. The project includes both hardware and software components, enabling scheduled feeding and remote control via a web interface.

## Why this project?
- Developed skills in integrating hardware with software.
- Learned about IoT (Internet of Things) and its applications.
- Gained experience in building a full-stack application.
- Improved understanding of automation and control systems.

## Build and Launch Instructions

- Clone the Repository
`git clone https://github.com/FilonenkoDima/FishFeeder.git`
`cd FishFeeder`
- Install Dependencies
`npm install`
- Start the Project in Development Mode
`npm start`
- Build the Project for Production
`npm run build`

## Project Structure
- `index.html` — The main web interface for controlling the FishFeeder.
- `css/` — Stylesheets for the web interface.
- `js/` — JavaScript files for handling user interactions and communication with the hardware.
- `hardware/` — Contains schematics and code for the hardware components, such as the microcontroller and sensors.

## Application Architecture and Components
### Key Components
- Web Interface — Allows users to schedule feedings and monitor the status of the FishFeeder.
- Microcontroller Code — Controls the feeding mechanism and communicates with the web interface.
- Sensors — Detects the amount of food dispensed and the environment in the aquarium.
### Responsive Design
The web interface is designed to be responsive, ensuring that it works well on both desktop and mobile devices.
