import React from "react";
import { FreeCamera, Vector3, HemisphericLight, MeshBuilder } from "@babylonjs/core";
import SceneComponent from "./Scene";
import "./App.css";
import * as BABYLON from "@babylonjs/core/Legacy/legacy";
import * as GUI from '@babylonjs/gui';
import 'babylonjs-loaders';




// Amplify Imports
import { API, Storage } from "aws-amplify";
import * as mutations from './graphql/mutations';

let box;
let sphere;

/*
  Will be called to use our GraphQL API to create a new 
  colorChange entry in the DynamoDB table
*/
async function createColorChange(color) {
  const colorChangeDetails = {
    name: 'Color changed',
    value: color
  };

  const newColorChange = await API.graphql({
    query: mutations.createColorChange,
    variables: { input: colorChangeDetails }
  });
}

const onSceneReady = async (scene) => {

  // This creates and positions a free camera (non-mesh)
  const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);

  // This targets the camera to scene origin
  camera.setTarget(Vector3.Zero());

  const canvas = scene.getEngine().getRenderingCanvas();

  // This attaches the camera to the canvas
  camera.attachControl(canvas, true);

  // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

  // Default intensity is 1. Lets dim the light a small amount
  light.intensity = 0.7;

  // This retrieves our texture that is being stored in S3 
  let texture = await Storage.get('checkered-texture.png', { validateObjectExistence: false });

  // Create your sphere and set its position
  sphere = BABYLON.MeshBuilder.CreateSphere("sphere1", { segments: 16, diameter: 2 }, scene);
  sphere.position.y = 1;
  const env = scene.createDefaultEnvironment();

  // We now create the rest of our scene
  var plane = BABYLON.Mesh.CreatePlane("plane", 1);
  plane.position = new BABYLON.Vector3(1.4, 1.5, 0.4)
  var advancedTexture = GUI.AdvancedDynamicTexture.CreateForMesh(plane);
  var panel = new GUI.StackPanel();
  advancedTexture.addControl(panel);
  var header = new GUI.TextBlock();
  header.text = "Color GUI";
  header.height = "200px";
  header.color = "white";
  header.textHorizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
  header.fontSize = "200"
  panel.addControl(header);

  // Create a color picker
  var picker = new GUI.ColorPicker();
  sphere.material = new BABYLON.StandardMaterial("sphere material", scene)
  picker.value = sphere.material.diffuseColor;
  picker.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
  picker.height = "800px";
  picker.width = "800px";
  // Here we set the texture of the sphere to our imported texture
  sphere.material.diffuseTexture = new BABYLON.Texture(
    texture,
    scene
  );
  // Change the color of the sphere when the picker is used 
  picker.onValueChangedObservable.add(function (value) {
    sphere.material.diffuseColor.copyFrom(value);
    createColorChange(value);
  });
  panel.addControl(picker);

  // Enable WebXR
  const xr = await scene.createDefaultXRExperienceAsync();

};

/**
 * Will run on every frame render.  We are spinning the box on y-axis.
 */
const onRender = (scene) => {

  if (box !== undefined) {
    const deltaTimeInMillis = scene.getEngine().getDeltaTime();

    const rpm = 10;
    box.rotation.y += (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
  }
};

export default () => (
  <body>
    <div>
      <SceneComponent style={{ height: '100vh', width: '100vw' }} antialias onSceneReady={onSceneReady} onRender={onRender} id="my-canvas" />
    </div>
  </body>
);
