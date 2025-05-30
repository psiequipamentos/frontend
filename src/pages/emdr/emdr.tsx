import React from "react";
import SelectCustom from "../../components/inputs/select-custom";
import EmdrSounds from "./emdrSounds";
import WebsocketServer from "../../ws/server";
import DragDropModal from "../../components/modals/DragDropModal";
import Chat from "../../components/chat";
import buttonCustom from "../../components/buttons/button";
import DailyIframe, { DailyParticipantsObject } from "@daily-co/daily-js";
import axios from "axios";
import "../../styles/VideoSmall.css";
import { serverConnectionConfigProduction } from "../../config/server-connection.config";
import {
  hide,
  muteMicrofone,
  pause,
  play,
  show,
  unMuteMicrofone,
} from "./icons";
import DragCamera from "../../components/modals/dragCamera/DragCamera";
import { closeIcon, fullScreenIcon, sendIcon } from "../home/mocks/icons";
import Modal from "../../components/modals/modal";
import Invite from "../home/invite";
import InviteButton from "./InviteButton";
import Timer from "../../components/timer/timer";
import { powerIcon, speedIcon, userIcon } from "../../components/icons/icons";
import "./canvas.css";
interface IEmdrProps {
  ControlsVisibility: boolean;
}

interface IEmdrState {
  canvas: any;
  canvasWidth: number;
  canvasHeight: number;

  position: any;
  sacadicPosition: any;
  direction: any;
  velocity: number;
  stop: boolean;
  playSound: boolean;
  visibility: boolean;
  sacadicSide: string;

  circleSize: number;
  circleColor: string;

  intervalo: number;

  directionStatus: string;
  nextDirection: string;

  countMovements: any;
  maxNumberOfMovements: any;

  balanceSound: number;

  messages: any;
  url: any;
  mic_state: boolean;

  pacient_connected: boolean;
  all_users_connected: boolean;
  nome_paciente: string;
}

const buttonStyle =
  "z-30 mx-auto bg-gray-800 h-12 w-12 rounded lg:p-1 text-white hover:bg-white hover:text-black text-xs font-semibold focus:ring";

const buttonPaciente =
  "z-30 p-10 mx-1  rounded lg:p-1 bg-black hover:bg-white text-white hover:text-black";
let playInterval: any;

const SelectNumber = [
  { name: "∞", value: 1000000000 },
  { name: "8", value: 8 },
  { name: "16", value: 16 },
  { name: "30", value: 30 },
  { name: "44", value: 44 },
  { name: "62", value: 62 },
];

const SelectMovement = [
  { name: "↔", value: "horizontal" },
  { name: "↕", value: "vertical" },
  { name: "⤡", value: "diagonal1" },
  { name: "⤢", value: "diagonal2" },
  { name: "o o", value: "sacadico" },
];

const MovementControlsStyle =
  "absolute bottom-0 w-full left-0 z-50 grid items-center grid-cols-12 bg-opacity-50 lg:bg-gray-900";
const MovementControlsStylePaciente =
  "absolute w-full bottom-0 items-center left-0 z-50 flex flex-row-reverse gap-6";

let centerX = (document.documentElement.clientWidth - 5) / 2 - 45;
let centerY = (document.documentElement.clientHeight - 5) / 2;

// ---------- SOCKET --------------------
const init_ws = new WebsocketServer();
const url = window.location.href;
const user_type = url.split("/").reverse()[1] === 'sala' ? 'paciente' : url.split("/").reverse()[1];
const code: any = url.split("/").reverse()[0];
init_ws.run(user_type, code);
const socket = init_ws.socket;

export default class Emdr extends React.Component<IEmdrProps, IEmdrState> {
  private callObject;
  private serverConfig;
  constructor(props: IEmdrProps) {
    super(props);
    console.log("Emdr constructor", user_type, code, url, socket, serverConnectionConfigProduction)
    this.serverConfig = serverConnectionConfigProduction;
    this.callObject = DailyIframe.createCallObject();
    this.state = {
      nome_paciente: "",
      all_users_connected: false,
      pacient_connected: false,
      messages: [],
      canvas: React.createRef(),
      canvasWidth: document.documentElement.clientWidth - 5,
      canvasHeight: document.documentElement.clientHeight - 5,

      position: { x: centerX, y: centerY },
      sacadicPosition: { x: centerX, y: centerY },
      direction: { x: 0, y: 0, dir: "none", lastDir: "none" },
      velocity: 3,
      stop: true,
      playSound: false,
      visibility: false,
      sacadicSide: "left",

      circleSize: 20,
      circleColor: "#32CD32",

      intervalo: 10,

      directionStatus: "stop",
      nextDirection: "horizontal",

      countMovements: SelectNumber[0].value,
      maxNumberOfMovements: SelectNumber[0].value,

      balanceSound: 0,
      url: `${this.serverConfig.daily_co_api}/${
        window.location.href.split("/").reverse()[0]
      }`,
      mic_state: true,
    };

    this.moveBalls = this.moveBalls.bind(this);
    this.drawBalls = this.drawBalls.bind(this);
    this.setDirection = this.setDirection.bind(this);
    this.changeMovement = this.changeMovement.bind(this);
    this.setAuxDirection = this.setAuxDirection.bind(this);
    this.horizontalMovement = this.horizontalMovement.bind(this);
    this.verticalMovement = this.verticalMovement.bind(this);
    this.diagonalMovement = this.diagonalMovement.bind(this);
    this.sacadicMovement = this.sacadicMovement.bind(this);
    this.sacadicAux = this.sacadicAux.bind(this);
    this.setVelocity = this.setVelocity.bind(this);
    this.chageVelocity = this.chageVelocity.bind(this);
    this.show = this.show.bind(this);
    this.hide = this.hide.bind(this);
    this.left = this.left.bind(this);
    this.right = this.right.bind(this);
    this.top = this.top.bind(this);
    this.bottom = this.bottom.bind(this);
    this.isInCenterX = this.isInCenterX.bind(this);
    this.isInCenterY = this.isInCenterY.bind(this);
    this.isInLeft = this.isInLeft.bind(this);
    this.isInRight = this.isInRight.bind(this);
    this.isOnTop = this.isOnTop.bind(this);
    this.isOnBottom = this.isOnBottom.bind(this);
    this.stop = this.stop.bind(this);
    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
    this.isNotMoving = this.isNotMoving.bind(this);
    this.setColor = this.setColor.bind(this);
    this.balanceX = this.balanceX.bind(this);
    this.callObject = DailyIframe.createCallObject();
    this.joinCall = this.joinCall.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.entrar = this.entrar.bind(this);
    this.videoCallListeners = this.videoCallListeners.bind(this);
    this.changeMicState = this.changeMicState.bind(this);
    this.hideBallOnPause = this.hideBallOnPause.bind(this);
    this.toggleFullscreen = this.toggleFullscreen.bind(this);
    this.resizeCanvas = this.resizeCanvas.bind(this);
  }

  toggleFullscreen() {
    console.log("Emdr toggleFullscreen", user_type, this)
    if (!document.fullscreen) {
      var elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  resizeCanvas() {
    console.log("Emdr resizeCanvas", user_type, this)
    centerX = (document.documentElement.clientWidth - 5) / 2 - 45;
    centerY = (document.documentElement.clientHeight - 5) / 2;
    if (this.state.directionStatus === "sacadico") {
      this.setState({ sacadicPosition: { x: centerX, y: centerY } });
    }
    this.setState({ position: { x: centerX, y: centerY } });
    this.setState({
      canvasWidth: document.documentElement.clientWidth - 5,
      canvasHeight: document.documentElement.clientHeight - 5,
    });
  }
  componentDidMount() {
    console.log("Emdr componentDidMount", user_type, this)
    window.addEventListener("resize", this.resizeCanvas);
    // * PREJOIN
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: false,
      })
      .then((stream: any) => {
        let video: any = document.querySelector("video");
        video.srcObject = stream;
        this.entrar();
      });
    this.videoCallListeners();
    // * PREJOIN
    const ctx = this.state.canvas.current.getContext("2d");
    playInterval = setInterval(() => this.moveBalls(ctx), this.state.intervalo);

    //**SOCKET
    socket.on("ball-handler", (data) => {
      console.log("Emdr componentDidMount ball-handler", user_type, data)
      this.setState({ [data.property]: data.value } as any)
    });
    
    socket.on("start-cron", (data: any) => {
      console.log("Emdr componentDidMount start-cron", user_type, data)
      if (user_type === "paciente") {
        this.setState({ nome_paciente: data.paciente });
        this.setState({ pacient_connected: true });
      }
      this.setState({ all_users_connected: true });
    });

    socket.on("end-call", () => this.endCall());
  }

  handleChange = (event: any) =>{
    console.log("Emdr handleChange", user_type, this, event)
    this.setState({ [event.target.name]: event.target.value } as any);
  }

  joinCall(url: any) {
    console.log("Emdr joinCall", user_type, url, this)
    return new Promise((resolve, reject) =>
      this.callObject
        .join({ url })
        .then((res) => resolve(res))
        .catch((err) => reject(err))
    );
  }

  async entrar() {
    console.log("Emdr entrar", user_type, this)
    try {
      await this.joinCall(this.state.url);
      socket.emit("user-joined", { codigo: this.state.url });
    } catch (err) {
      console.log("Emdr entrar error", user_type, err)
    }
  }

  setColor(event: any) {
    console.log("Emdr setColor", user_type, this, event);
    this.setState({ circleColor: event.target.value });

    //**SOCKET
    const data_to_send = {
      property: "circleColor",
      value: event.target.value,
    };
    socket.emit("ball-handler", data_to_send);
  }

  drawBalls(ctx: any, clear: any) {
    if (clear === true) {
      ctx.clearRect(0, 0, this.state.canvasWidth, this.state.canvasHeight);
    }
    ctx.beginPath();
    ctx.fillStyle = this.state.circleColor;
    ctx.arc(
      this.state.position.x,
      this.state.position.y,
      this.state.circleSize,
      0,
      Math.PI * 2,
      true
    );
    ctx.arc(
      this.state.position.x + this.state.circleSize * 2 + 50,
      this.state.position.y,
      this.state.circleSize,
      0,
      Math.PI * 2,
      true
    );
    ctx.closePath();
    ctx.fill();
  }

  left() {
    return this.state.circleSize;
  }
  right() {
    return this.state.canvasWidth - this.state.circleSize;
  }
  top() {
    return this.state.circleSize;
  }
  bottom() {
    return this.state.canvasHeight - this.state.circleSize;
  }

  isInCenterX() {
    return (
      this.state.position.x > centerX - 10 &&
      this.state.position.x < centerX + 10
    );
  }
  isInCenterY() {
    return (
      this.state.position.y > centerY - 10 &&
      this.state.position.y < centerY + 10
    );
  }
  isInLeft() {
    return this.state.position.x < this.state.circleSize;
  }
  isInRight() {
    return (
      this.state.position.x >
      this.state.canvasWidth - this.state.circleSize * 8 + 50
    );
  }
  isOnTop() {
    return this.state.position.y < this.state.circleSize;
  }
  isOnBottom() {
    return (
      this.state.position.y > this.state.canvasHeight - this.state.circleSize
    );
  }

  show() {
    this.setState({ visibility: true });

    if (user_type !== "psicologo") {
      const data_to_send = {
        property: "visibility",
        value: true,
      };
      socket.emit("ball-handler", data_to_send);
    }
  }
  hide() {
    this.setState({ visibility: false });

    if (user_type !== "psicologo") {
      const data_to_send = { property: "visibility", value: false };
      socket.emit("ball-handler", data_to_send);
    }
  }

  setVelocity(variable: any, velocity: any) {
    if (this.state.direction[variable] > 0) {
      this.setState({ direction: { [variable]: velocity } });

      //**SOCKET
      const data_to_send = {
        property: "direction",
        value: { [variable]: velocity },
      };
      socket.emit("ball-handler", data_to_send);
    } else {
      this.setState({ direction: { [variable]: -velocity } });

      //**SOCKET
      const data_to_send = {
        property: "direction",
        value: { [variable]: -velocity },
      };
      socket.emit("ball-handler", data_to_send);
    }
  }

  chageVelocity(velocity: number) {
    this.setState({ velocity: velocity });

    //**SOCKET
    const data_to_send = {
      property: "velocity",
      value: velocity,
    };
    socket.emit("ball-handler", data_to_send);

    if (this.state.direction.x && !this.state.direction.y) {
      this.setVelocity("x", velocity);
    }
    if (this.state.direction.y && !this.state.direction.x) {
      this.setVelocity("y", velocity);
    }

    if (this.state.direction.y && this.state.direction.x) {
      if (this.state.direction.x > 0 && this.state.direction.y > 0) {
        this.setState({
          direction: {
            x: velocity,
            y: velocity,
            lastDir: this.state.direction.lastDir,
          },
        });

        //**SOCKET
        const data_to_send = {
          property: "direction",
          value: this.state.direction,
        };
        socket.emit("ball-handler", data_to_send);
      } else if (this.state.direction.x < 0 && this.state.direction.y < 0) {
        this.setState({
          direction: {
            x: -velocity,
            y: -velocity,
            lastDir: this.state.direction.lastDir,
          },
        });

        //**SOCKET
        const data_to_send = {
          property: "direction",
          value: this.state.direction,
        };
        socket.emit("ball-handler", data_to_send);
      }
    }
  }

  balanceX() {
    if (this.state.directionStatus === "sacadico") {
      if (this.state.sacadicPosition.x > centerX) {
        const balance = this.state.sacadicPosition.x / this.right();
        this.setState({ balanceSound: balance });
      } else {
        const balance = (1 - this.state.sacadicPosition.x / this.right()) * -1;
        this.setState({ balanceSound: balance });
      }
    } else {
      if (this.state.position.x > centerX) {
        const balance = this.state.position.x / this.right() - 0.1;
        this.setState({ balanceSound: balance });
      } else {
        const balance = (1 - this.state.position.x / this.right()) * -1 + 0.1;
        this.setState({ balanceSound: balance });
      }
    }
  }

  changeMovement() {
    if (this.state.nextDirection !== this.state.directionStatus) {
      this.setState({ stop: true }, () => setTimeout(() => this.play(), 700));
    }
  }

  hideBallOnPause() {
    setTimeout(() => {
      if (this.state.directionStatus === "stop") {
        this.setState({ visibility: false });
      }
    }, 3000);
  }

  startMovement(x: number, y: number, dir: string) {
    this.setState({
      direction: {
        x: x,
        y: y,
        dir: dir,
        lastDir: this.state.direction.lastDir,
      },
      stop: false,
    });
  }

  horizontalMovement(movementDirection: number) {
    if (this.state.direction.x === 0) {
      this.startMovement(this.state.velocity, 0, "right");
    }
    if (this.isInCenterX()) {
      if (!this.state.stop) {
        this.changeMovement();
      }
      if (this.state.stop) {
        this.stop();
        this.setPlaySound(false);
        this.hideBallOnPause();
      }
    }

    if (this.isInLeft()) {
      this.setState({ countMovements: this.state.countMovements - 1 });
    }

    if (this.isInLeft() || this.isInRight()) {
      this.state.direction.x = -this.state.direction.x;
    }

    this.state.position.x += this.state.direction.x * movementDirection;

    this.balanceX();
  }

  verticalMovement() {
    if (this.state.direction.y === 0) {
      this.startMovement(0, this.state.velocity, "right");
    }
    if (this.isInCenterY()) {
      if (this.state.stop) {
        this.stop();
        this.hideBallOnPause();
      } else {
        this.changeMovement();
      }
    }

    if (this.isOnTop() && this.state.countMovements !== "infinito") {
      this.setState({ countMovements: this.state.countMovements - 1 });
    }

    if (this.isOnTop() || this.isOnBottom()) {
      this.state.direction.y = -this.state.direction.y;
    }

    this.state.position.y += this.state.direction.y;
  }

  diagonalMovement(diagonalDirection: number) {
    if (this.isNotMoving()) {
      this.startMovement(this.state.velocity, this.state.velocity, "right");
    }

    if (this.isInCenterX() && this.isInCenterY()) {
      if (this.state.stop) {
        this.stop();
        this.setPlaySound(false);
        this.hideBallOnPause();
      } else {
        this.changeMovement();
      }
    }

    if (this.isOnTop() && this.state.countMovements !== "infinito") {
      this.setState({ countMovements: this.state.countMovements - 1 });
    }

    if (this.isOnTop() || this.isOnBottom()) {
      this.state.direction.y = -this.state.direction.y;
      this.state.direction.x = -this.state.direction.x;
    }

    this.state.position.x += this.state.direction.x * diagonalDirection;
    this.state.position.y += this.state.direction.y;
    this.balanceX();
  }

  sacadicAux(side: string) {
    if (this.state.stop) {
      this.stop();
      this.setPlaySound(false);
      this.hideBallOnPause();
    } else {
      if (side === "left") {
        this.state.position.x =
          this.state.canvasWidth - this.state.circleSize * 8 + 50; // lado direito
        this.setState({ sacadicSide: "right" });
      } else {
        this.state.position.x = this.state.circleSize; //lado esquerdo
        this.setState({ sacadicSide: "left" });
      }
    }
  }

  sacadicMovement() {
    if (this.state.direction.x === 0) {
      this.setState({
        direction: {
          x: this.state.velocity,
          y: 0,
          dir: "right",
          lastDir: this.state.direction.lastDir,
        },
        stop: false,
      });
    }

    if (
      this.state.sacadicPosition.x > centerX - 10 &&
      this.state.sacadicPosition.x < centerX + 10
    ) {
      if (!this.state.stop) {
        this.changeMovement();
      }
    }

    if (
      this.state.sacadicPosition.x < this.state.circleSize &&
      this.state.countMovements !== "infinito"
    ) {
      this.setState({ countMovements: this.state.countMovements - 1 });
    }

    if (
      this.state.sacadicPosition.x < this.state.circleSize ||
      this.state.sacadicPosition.x >
        this.state.canvasWidth - this.state.circleSize * 8 + 50
    ) {
      this.state.direction.x = -this.state.direction.x;
      this.sacadicAux(this.state.sacadicSide);
    }

    this.state.sacadicPosition.x += this.state.direction.x;
    this.balanceX();
  }

  play() {
    console.log("Emdr play", user_type, this, this.isNotMoving());
    if (this.isNotMoving()) {
      this.setState({ visibility: true });
      this.setState({ stop: false }, () => (this.state.direction.x = 0));
      this.setDirection(this.state.nextDirection);
      if (this.state.nextDirection !== this.state.directionStatus) {
        this.setCounter(this.state.maxNumberOfMovements);
      }
    }

    //**SOCKET
    const data_to_send = {
      property: "visibility",
      value: true,
    };
    socket.emit("ball-handler", data_to_send);
  }

  pause() {
    this.setState({ stop: true });

    //**SOCKET
    const data_to_send = {
      property: "stop",
      value: true,
    };
    socket.emit("ball-handler", data_to_send);
  }

  stop() {
    if (this.state.directionStatus === "sacadico") {
      this.setState({ sacadicPosition: { x: centerX, y: centerY } });
    }
    this.setState(
      {
        direction: { x: 0, y: 0, lastDir: this.state.directionStatus },
        directionStatus: "stop",
      },
      () => this.setPlaySound(false)
    );
    this.setState({ position: { x: centerX, y: centerY } });
    setTimeout(() => {
      if (user_type === "psicologo" && this.state.directionStatus === "stop") {
        this.setState({ visibility: false });
      }
    }, 5000);
  }

  isNotMoving() {
    return this.state.direction.x === 0 && this.state.direction.y === 0;
  }

  setDirection(direction: string) {
    if (this.isInCenterX() && this.isInCenterY() && this.isNotMoving()) {
      this.setState({ directionStatus: direction });

      //**SOCKET
      const data_to_send = {
        property: "directionStatus",
        value: direction,
      };
      socket.emit("ball-handler", data_to_send);
    }
  }

  setAuxDirection(direction: string) {
    this.setState({ nextDirection: direction });

    //**SOCKET
    const data_to_send = {
      property: "nextDirection",
      value: direction,
    };
    socket.emit("ball-handler", data_to_send);
  }

  setCounter(value: any) {
    this.setState({ countMovements: value, maxNumberOfMovements: value });

    //**SOCKET
    const data_to_send = {
      property: "countMovements",
      value: value,
    };
    socket.emit("ball-handler", data_to_send);
    const data_to_send2 = {
      property: "maxNumberOfMovements",
      value: value,
    };
    socket.emit("ball-handler", data_to_send2);
  }

  setPlaySound(value: boolean) {
    if (this.state.playSound !== value) {
      this.setState({ playSound: value });

      const data_to_send = {
        property: "playSound",
        value: this.state.playSound,
      };
      socket.emit("audio-handler", data_to_send);
    }
  }

  moveBalls(ctx: any) {
    if (this.state.visibility) {
      this.drawBalls(ctx, true);
    } else {
      ctx.clearRect(0, 0, this.state.canvasWidth, this.state.canvasHeight);
    }
    if (!this.state.countMovements) {
      this.setState({ stop: true });
    }
    if (this.state.directionStatus === "horizontal") {
      this.setPlaySound(true);
      this.horizontalMovement(1);
    }
    if (this.state.directionStatus === "diagonal2") {
      this.setPlaySound(true);
      this.diagonalMovement(-1);
    }
    if (this.state.directionStatus === "diagonal1") {
      this.setPlaySound(true);
      this.diagonalMovement(1);
    }
    if (this.state.directionStatus === "vertical") {
      this.setPlaySound(true);
      this.verticalMovement();
    }
    if (this.state.directionStatus === "sacadico") {
      this.setPlaySound(true);
      this.sacadicMovement();
    }
  }
  changeMicState = () => this.callObject.setLocalAudio(this.state.mic_state);

  endCall = () => {
    if (user_type === "psicologo") window.location.href = "/home";
    else if (user_type === "paciente")
      window.location.href = "/chamada-encerrada";
  };
  videoCallListeners() {
    this.callObject.on("participant-updated", async (event) => {
      console.log("Emdr videoCallListeners participant-updated", user_type, event);
      if (event?.participant.video && event.participant.audio) {
        const streams = this.callObject.participants();
        let callItems: any = {};
        let callAudioItems: any = {};
        for (const [id, participant] of Object.entries(streams)) {
          callItems[id] = {
            videoTrack: participant.tracks.video.track,
          };
        }

        for (const [id, participant] of Object.entries(streams)) {
          callAudioItems[id] = {
            audioTrack: participant.tracks.audio.track,
          };
        }

        if (Object.keys(callItems).length >= 2) {
          let videoStreams: any = {};
          let audioStreams: any = {};
          for (const [id] of Object.entries(callItems) as any) {
            if (id !== "local" && !videoStreams[id]) {
              if (!videoStreams[id])
                videoStreams[id] = document.createElement("video");
            }
          }
          for (const [id] of Object.entries(callAudioItems) as any) {
            if (id !== "local" && !audioStreams[id]) {
              if (!audioStreams[id])
                audioStreams[id] = document.createElement("audio");
            }
          }

          for (const [id, videoStreamer] of Object.entries(
            videoStreams
          ) as any) {
            videoStreamer.setAttribute(
              "class",
              "fixed top-0 z-0 w-full h-full lg:mx-auto my-auto bg-gray-900"
            );
            videoStreamer.setAttribute("autoplay", "true");
            videoStreamer.setAttribute("id", id);
            const users_containers: any =
              document.getElementById("users-container");
            users_containers.appendChild(videoStreamer);
            try {
              const videoStream = new MediaStream();
              videoStream.addTrack(callItems[id].videoTrack);
              videoStreamer.srcObject = videoStream;
            } catch (stream_creation_error) {
              console.log("Erro creating media");
              console.log(stream_creation_error);
            }
          }

          for (const [id, audioStreamer] of Object.entries(
            audioStreams
          ) as any) {
            audioStreamer.setAttribute("autoplay", "true");
            audioStreamer.setAttribute("id", id);
            try {
              const audioStream = new MediaStream();
              audioStream.addTrack(callAudioItems[id].audioTrack);
              audioStreamer.srcObject = audioStream;
            } catch (audio_stream_error) {
              console.log("error audio stream");
            }
          }
        }
      }
    });
  }
  render() {
    return (
      <div className="grid items-center text-white">
        <div>
          <EmdrSounds
            velocity={this.state.velocity}
            play={this.state.playSound}
            soundBalance={this.state.balanceSound}
            ControlsVisibility={this.props.ControlsVisibility}
            socket={socket}
          ></EmdrSounds>

          <div
            className={
              this.props.ControlsVisibility
                ? MovementControlsStyle
                : MovementControlsStylePaciente
            }
          >
            {this.props.ControlsVisibility ? (
              <label className="col-span-4 pt-1 m-2 mx-auto text-sm font-semibold text-black rounded lg:block flex lg:text-white lg:col-span-1">
                {speedIcon}
                <input
                  className="z-50 mb-3 my-auto"
                  type="range"
                  name="velocity"
                  min={1}
                  value={this.state.velocity}
                  max={20}
                  onChange={(event) => this.chageVelocity(+event.target.value)}
                />
              </label>
            ) : null}

            {this.props.ControlsVisibility ? (
              <div className="z-50 grid grid-cols-1 col-span-4 text-sm font-emibold  lg:col-span-1 lg:grid-cols-1">
                <div className="z-30 grid items-center mx-auto align-text-bottom bg-gray-800 h-12 w-12 rounded lg:p-1 text-white text-xs font-semibold focus:ring">
                  <span className="text-center">
                    {" "}
                    {this.state.maxNumberOfMovements -
                      this.state.countMovements}{" "}
                  </span>
                </div>
              </div>
            ) : null}

            {this.props.ControlsVisibility ? (
              <div className="z-50 grid grid-cols-1 col-span-4 text-sm font-semibold text-center lg:col-span-1 lg:grid-cols-1">
                <label className="text-center">
                  <SelectCustom
                    name={"movimentos"}
                    options={SelectNumber}
                    handleChange={(event: any) =>
                      this.setCounter(event.target.value)
                    }
                  />
                </label>
              </div>
            ) : null}

            {this.props.ControlsVisibility ? (
              <div className="z-50 grid grid-cols-1 col-span-4 text-sm font-semibold text-center lg:col-span-1 lg:grid-cols-1">
                <label>
                  <SelectCustom
                    name={"tipos"}
                    options={SelectMovement}
                    handleChange={(event: any) =>
                      this.setAuxDirection(event.target.value)
                    }
                  />
                </label>
              </div>
            ) : null}

            {this.props.ControlsVisibility ? (
              <div className="z-50 grid grid-cols-1 col-span-4 text-sm font-emibold text-center lg:col-span-1 lg:grid-cols-1">
                {this.state.visibility ? (
                  <button className={buttonStyle} onClick={this.hide}>
                    {hide}
                  </button>
                ) : (
                  <button className={buttonStyle} onClick={this.show}>
                    {show}
                  </button>
                )}
              </div>
            ) : null}

            {this.props.ControlsVisibility ? (
              <div className="z-50 grid grid-cols-1 col-span-4 text-center lg:col-span-1 lg:grid-cols-1">
                {this.isNotMoving() ? (
                  <button className={buttonStyle} onClick={this.play}>
                    {play}
                  </button>
                ) : (
                  <button className={buttonStyle} onClick={this.pause}>
                    {pause}
                  </button>
                )}
              </div>
            ) : null}

            {this.props.ControlsVisibility ? (
              <div className="z-50 grid grid-cols-1 col-span-4 text-center lg:col-span-1 lg:grid-cols-1">
                <input
                  className="z-50 px-5 py-5 rounded mx-auto h-12 w-12"
                  style={{ backgroundColor: this.state.circleColor }}
                  type="color"
                  name="circleColor"
                  onChange={(event) => this.setColor(event)}
                />
              </div>
            ) : null}
            {this.props.ControlsVisibility ? (
              <div className="z-50 grid grid-cols-1 col-span-4 text-center lg:col-span-1 lg:grid-cols-1">
                <button
                  className={buttonStyle + " bg-white"}
                  onClick={() =>
                    this.setState({ mic_state: !this.state.mic_state }, () =>
                      this.changeMicState()
                    )
                  }
                >
                  {this.state.mic_state ? muteMicrofone : unMuteMicrofone}
                </button>
              </div>
            ) : null}
            {this.props.ControlsVisibility ? (
              <div className="z-50 grid grid-cols-1 col-span-4 text-center lg:col-span-1 lg:grid-cols-1">
                <Modal openModalComponent={InviteButton}>
                  <Invite
                    nome={"João"}
                    url_sessao={document.URL.split("psicologo/")[1]}
                    hash_paciente={localStorage.getItem("hash_paciente")!}
                  ></Invite>
                </Modal>
              </div>
            ) : null}

            <div className="z-50 grid grid-cols-1 col-span-4 text-center lg:col-span-1 lg:grid-cols-1">
              <button className={buttonStyle} onClick={this.toggleFullscreen}>
                {fullScreenIcon}
              </button>
            </div>

            {this.props.ControlsVisibility ? (
              <div className="z-50 grid grid-cols-1 col-span-4 text-center lg:col-span-1 lg:grid-cols-1">
                <button
                  className={buttonStyle}
                  onClick={() => socket.emit("end-call", { code })}
                >
                  {powerIcon}{" "}
                  {this.state.all_users_connected ? <Timer /> : null}
                </button>
              </div>
            ) : null}

            <div className="z-50 grid grid-cols-1 relative col-span-4 text-center lg:col-span-1 lg:grid-cols-1relative z-50 text-center">
              <DragDropModal
                content={Chat}
                openModalComponent={buttonCustom}
                socket={socket}
              />{/*""*/}
              {this.props.ControlsVisibility ? (
                <span className={"text-xs font-semibold break-words"}>
                  {this.state.pacient_connected ? (
                    <span className="text-green-500 ">
                      {this.state.nome_paciente}
                    </span>
                  ) : (
                    <span className="text-red-500"> {userIcon}</span>
                  )}
                </span>
              ) : null}
            </div>
            {this.props.ControlsVisibility === false ? (
              <span className={"text-xs font-semibold break-words"}>
                {this.state.pacient_connected ? (
                  <span className="text-green-500 ">{userIcon}</span>
                ) : (
                  <span className="text-red-500"> {userIcon}</span>
                )}
              </span>
            ) : null}
          </div>

          {/* // * Pre join */}
          <div className={"z-10 font-semibold text-sm"}>
            <div>
              <DragCamera>
                <video
                  className="z-10 small-video"
                  id={"self-camera"}
                  width="100px"
                  autoPlay={true}
                ></video>
              </DragCamera>
            </div>
          </div>
          {/* // * prejoin */}

          <div
            className="fixed top-0 z-0 w-full mx-auto min-h-screen"
            id="users-container"
          ></div>

          <canvas
            ref={this.state.canvas}
            className={`absolute overflow-none top-0 w-full min-h-screen ${
              !this.isNotMoving() && this.props.ControlsVisibility === false
                ? "bg-gray-900 z-100"
                : "z-20"
            } `}
            width={this.state.canvasWidth}
            height={this.state.canvasHeight}
          ></canvas>
        </div>
      </div>
    );
  }
}
