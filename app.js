import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, vec4, mult, rotateZ} from "../../libs/MV.js";
import {modelView, loadMatrix, multRotationY, multScale, multTranslation, popMatrix, pushMatrix, multRotationZ, multRotationX} from "../../libs/stack.js";

import * as PYRAMID from '../../libs/pyramid.js';
import * as CUBE from '../../libs/cube.js';
import * as CYLINDER from '../../libs/cylinder.js';
import * as SPHERE from '../../libs/sphere.js';
import * as TORUS from '../../libs/torus.js';
//import { draw } from "./libs/torus.js";


/** @type WebGLRenderingContext */
let gl;

let time = 0;           // Global simulation time in days
let speed = 1/60.0;     // Speed (how many days added to time on each render pass
let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
let animation = true;   // Animation is running
let VP_DISTANCE = 5;    //ViewPoint distance

//Commands
const moreZoom = '+';
const lessZoom = '-';
const rizeBazuka ='w';
const lowerBazuka = 's';
const wireView = 'W';
const meshView = 'S';
const rotLeftBazuka = 'a';
const rotRightBazuka = 'd'
const shootProjectile = ' ';
const moveTankForward = 'ArrowUp';
const moveTankBackwards = 'ArrowDown';
const frontViewComm = '1';
const topViewComm = '2';
const profileViewComm = '3';
const axonometricViewComm = '4';

//Camera Views
const frontView = lookAt([0.5,0,0], [0,0,0], [1,1,0]); //Camera's back view
const topView  = lookAt([0,1,0], [0,0,0], [1,1,0]);    //Camera's top view
const profileView = lookAt([0,0,0], [0,0,0], [1,1,0]); //Camera's profile view
const axonometricView = lookAt([3,3,3], [0,0,0], [1,2,1]); // Camera's axonometric view

let view = axonometricView; //Camera's first view

//Floor Constants
const floorScaleX = 1;
const floorScaleY = 0.4;
const floorScaleZ = 1;
const floorTranslationY = -0.5;

//Wheel Constants
const wheelScaleX = 1;
const wheelScaleY = 1;
const wheelScaleZ = 0.5;
const wheelTranslationY = 0.5;
const wheelRotationX = 90;


//Rim Constants
const rimScaleX = 0.6;
const rimScaleY = 0.6;
const rimScaleZ = 0.51;
const rimTranslationY = 0.5;
const rimRotationX = 90;

//Axle Constants
const axleScaleX = 0.3;
const axleScaleY = 3;
const axleScaleZ = 0.3;
const axleTranslationY = 0.5;
const axleTranslationZ = 1.5;
const axleRotationX = 90;

//Body Constants
const bodyScaleX = 5;
const bodyScaleY = 1.5;
const bodyScaleZ = 4;
const bodyTranslationX = 1.5;
const bodyTranslationY = 1.25;
const bodyTranslationZ = 1.5;

//Antenna1 Constants
const antenna1TranslationX = 0.2;
const antenna1TranslationY = 3.5;
const antenna1TranslationZ = 0.7;
const antenna1RotationX = -10;
const antenna1ScaleX = 0.01;
const antenna1ScaleY = 3;
const antenna1ScaleZ = 0.01;

//Antenna2 Constants
const antenna2TranslationX = 0.2;
const antenna2TranslationY = 3.5;
const antenna2TranslationZ = 2.3;
const antenna2RotationX = 10;
const antenna2ScaleX = 0.01;
const antenna2ScaleY = 3;
const antenna2ScaleZ = 0.01;

//Grill1 Constants
const grill1TranslationX = -1.001;
const grill1TranslationY = 1.7;
const grill1TranslationZ = 1.5;
const grill1RotationY = 90;
const grill1RotationZ = 90;
const grill1ScaleX = 0.01;
const grill1ScaleY = 2;
const grill1ScaleZ = 0.01;

//Grill2 Constants
const grill2TranslationX = -1.001;
const grill2TranslationY = 1.5;
const grill2TranslationZ = 1.5;
const grill2RotationY = 90;
const grill2RotationZ = 90;
const grill2ScaleX = 0.01;
const grill2ScaleY = 1.7;
const grill2ScaleZ = 0.01;

//Grill3 Constants
const grill3TranslationX = -1.001;
const grill3TranslationY = 1.3;
const grill3TranslationZ = 1.5;
const grill3RotationY = 90;
const grill3RotationZ = 90;
const grill3ScaleX = 0.01;
const grill3ScaleY = 1.3;
const grill3ScaleZ = 0.01;

//Head Constants
const headScaleX = 3;
const headScaleY = 0.5;
const headScaleZ = 2;
const headTranslationX = 1.5;
const headTranslationY = 2.25;
const headTranslationZ = 1.5;

//Apendice Constants
const appendiceScaleX = 0.2;
const appendiceScaleY = 0.5;
const appendiceScaleZ = 0.8;
const appendiceTranslationX = 0.5;
const appendiceTranslationY = 2.75;
const appendiceTranslationZ = 1.5;

//Bazuka Constants
const bazukaScaleX = 0.16;
const bazukaScaleY = 3.7;
const bazukaScaleZ = 0.16;
const bazukaTranslationX = 3.5;
const bazukaTranslationY = 2.6;
const bazukaTranslationZ = 1.5;
const bazukaRotationZ = 90;

//Bazuka Belt Constants
const bazukaBeltScaleX = 0.21;
const bazukaBeltScaleY = 0.5;
const bazukaBeltScaleZ = 0.21;
const bazukaBeltTranslationX = 2.6;
const bazukaBeltTranslationY = 2.6;
const bazukaBeltTranslationZ = 1.5;
const bazukaBeltRotationZ = 90;

//Bazuka Sleeve Constants
const bazukaSleeveScaleX = 0.21;
const bazukaSleeveScaleY = 3;
const bazukaSleeveScaleZ = 0.21;
const bazukaSleeveTranslationX = 4.8;
const bazukaSleeveTranslationY = 2.6;
const bazukaSleeveTranslationZ = 1.5;
const bazukaSleeveRotationZ = 90;

//Hatchet Constants
const hatchetScaleX = 1.5;
const hatchetScaleY = 1.5;
const hatchetScaleZ = 1.5;
const hatchetTranslationX = 1.7;
const hatchetTranslationY = 2.5;
const hatchetTranslationZ = 1.5;

//Colors 
const CYAN = vec4(0.7,1.0,1.0,1.0);
const MAGENTA = vec4(0.8,0.7,0.8,1.0);
const BLACK = vec4(0.0,0.0,0.0,1.0);
const DESERT_YELLOW = vec4(0.847059 , 0.847059 , 0.77902, 1.0);
const DARK_DESERT_YELLOW = vec4(0.6 , 0.6 , 0.6, 1.0);
const PURPLE = vec4(0.75,0.78,0.99,1.0);
const WHITE = vec4(1.0, 1.0, 1.0, 1.0);
const DARK_PURPLE = vec4(0.64,0.65,0.84,1.0);
const WEIRD_PINK = vec4(0.8,0.7,0.8,1.0);








let movementTank = 0;
let movementWheels = 0;
//ADDED VARIABLE TO MAKE BAZUKA GO UP AND DOWN NOT WORKING YET!
let bazukaAngle = 0;
//ADDED VARIABLE TO MAKE ROTATE NOT WORKING YET!
let movementHead = 0;
const bazukaAngleMIN = 0.0;
const bazukaAngleMAX = 30;
const fireVelocity = 10;

let bullet = false;
let bulletLoc = 0;
let bulletHeight = 0;
let bulletPos1;
let bulletPos2;
let velocityX=fireVelocity;
let velocityY=0;
let accelX=0;
let accelY=0;
let bulletX=0;
let bulletY=0;
let gForce = 9.8;



function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    let mProjection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);
    
    mode = gl.TRIANGLES; 

    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    document.onkeydown = function(event) {
        switch(event.key) {

            case moreZoom:
                if(VP_DISTANCE>3)
                    VP_DISTANCE--;
                mProjection = getOrthoValue();
                break;

            case lessZoom:
                if(VP_DISTANCE<10)
                    VP_DISTANCE++;
                mProjection = getOrthoValue();
                break;

            case rizeBazuka:
                if(bazukaAngle == bazukaAngleMAX)
                    break;
                else{
                    bazukaAngle+=0.5;
                    break;
                }

            case lowerBazuka:
                if(bazukaAngle == bazukaAngleMIN)
                    break;
                else{
                    bazukaAngle-=0.5;
                    break;
                }

            case wireView:
                mode = gl.LINES; 
                break;

            case meshView:
                mode = gl.TRIANGLES;
                break;

            case rotLeftBazuka:
                movementHead+= +0.5;
                break;
                
            case rotRightBazuka:
                movementHead+= -0.5;
                break;

            case shootProjectile:
                bullet = true;
                bulletLoc = 0;
                bulletPos1 = movementHead;
                bulletPos2 = bazukaAngle;
                time = new Date().getTime();
                break;

            case moveTankForward:
                movementTank+= 0.03;
                movementWheels+=1;
                break;

            case moveTankBackwards:
                movementTank-= 0.03;
                movementWheels-=1;
                break;

            case frontViewComm:
                view = frontView;
                break;
                
            case topViewComm:
                view = topView;
                break;

            case profileViewComm:
                view = profileView;
                break;

            case axonometricViewComm:
                view = axonometricView;
                break;
        }
    }

    gl.clearColor(0.5, 0.5, 0.6, 1.0);
    CUBE.init(gl);
    PYRAMID.init(gl);
    CYLINDER.init(gl);
    SPHERE.init(gl);
    TORUS.init(gl);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test
    
    window.requestAnimationFrame(render);


    function resize_canvas(event)
    {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        aspect = canvas.width / canvas.height;
        gl.viewport(0,0,canvas.width, canvas.height);
        mProjection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);
    
    }

    function uploadModelView()
    {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mModelView"), false, flatten(modelView()));
    }

    function getOrthoValue(){
        return ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);
    }

    function getFragColorVar(){
        return gl.getUniformLocation(program, "fColor");
    }

    function paint(color){
        let colorVar = getFragColorVar();
        gl.uniform4fv(colorVar, color);
    }

    function cilinderRotationY(){
        return -((movementTank*360) / Math.PI);
    }

    function drawFloor(){
        for(let i=-15; i<15;i++){
            for(let j=-15;j<15;j++){
                pushMatrix();
                floorTile(i,j);
                popMatrix();
            }
        }
    }

    function floorTile(i, j)
    {
    
        multScale([floorScaleX,floorScaleY, floorScaleZ]);
        multTranslation([i,floorTranslationY,j]);

        if((i+j)%2==0)
            paint(CYAN);
        else
            paint(MAGENTA);
    
        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a sphere representing the sun
        CUBE.draw(gl, program, mode);
    }


    function wheel(i,j){
        multTranslation([i,wheelTranslationY,j])
        multScale([wheelScaleX,wheelScaleY,wheelScaleZ])
        multRotationX(wheelRotationX)
        multRotationY(cilinderRotationY());

        uploadModelView();

        paint(BLACK);

        CYLINDER.draw(gl, program, mode);
    }

    
    function tankRim(i,j){
        multTranslation([i,rimTranslationY,j])
        multScale([rimScaleX,rimScaleY,rimScaleZ])
        multRotationX(rimRotationX)
        
        multRotationY(cilinderRotationY())
        
        uploadModelView();

        paint(DESERT_YELLOW);

        CYLINDER.draw(gl, program, mode);
    }

    function tankAxle(i){

        multTranslation([i,axleTranslationY,axleTranslationZ])
        multRotationX(axleRotationX);
        multScale([axleScaleX,axleScaleY,axleScaleZ])
        multRotationY(cilinderRotationY());

        uploadModelView();

        paint(DARK_DESERT_YELLOW);

        CYLINDER.draw(gl, program, mode);
    }

    function tankBody(){

        multTranslation([bodyTranslationX,bodyTranslationY,bodyTranslationZ])
        multScale([bodyScaleX,bodyScaleY,bodyScaleZ])

        uploadModelView();

        paint(PURPLE);

        CUBE.draw(gl, program, mode);
    }

    function antenna1(){
        multTranslation([antenna1TranslationX,antenna1TranslationY,antenna1TranslationZ])
        multRotationX(antenna1RotationX)
        multScale([antenna1ScaleX,antenna1ScaleY,antenna1ScaleZ])

        uploadModelView();

        paint(BLACK);

        CYLINDER.draw(gl, program, mode);
    }

    function antenna2(){
        multTranslation([antenna2TranslationX,antenna2TranslationY,antenna2TranslationZ])
        multRotationX(antenna2RotationX)
        multScale([antenna2ScaleX,antenna2ScaleY,antenna2ScaleZ])

        uploadModelView();

        paint(BLACK);
        CYLINDER.draw(gl, program, mode);
    }

    function grill1(){
        multTranslation([grill1TranslationX,grill1TranslationY,grill1TranslationZ])
        multRotationY(grill1RotationY)
        multRotationZ(grill1RotationZ)
        multScale([grill1ScaleX,grill1ScaleY,grill1ScaleZ])

        uploadModelView();

        paint(BLACK);

        CYLINDER.draw(gl, program, mode);
    }

    function grill2(){
        multTranslation([grill2TranslationX,grill2TranslationY,grill2TranslationZ])
        multRotationY(grill2RotationY)
        multRotationZ(grill2RotationZ)
        multScale([grill2ScaleX,grill2ScaleY,grill2ScaleZ])

        uploadModelView();

        paint(BLACK);

        CYLINDER.draw(gl, program, mode);
    }

    function grill3(){
        multTranslation([grill3TranslationX,grill3TranslationY,grill3TranslationZ])
        multRotationY(grill3RotationY)
        multRotationZ(grill3RotationZ)
        multScale([grill3ScaleX,grill3ScaleY,grill3ScaleZ])

        uploadModelView();

        paint(BLACK);

        CYLINDER.draw(gl, program, mode);
    }

    function tankHead(){
        multTranslation([headTranslationX,headTranslationY,headTranslationZ])   
        multScale([headScaleX,headScaleY,headScaleZ])

        uploadModelView();

        paint(DESERT_YELLOW);

        CUBE.draw(gl, program, mode);
    }

    function top_back_appendice() {
        multTranslation([appendiceTranslationX, appendiceTranslationY, appendiceTranslationZ])
        multScale([appendiceScaleX, appendiceScaleY, appendiceScaleZ])

        uploadModelView();

        paint(WHITE);

        CUBE.draw(gl, program, mode);
    }

    function bazuka(){
        
        multTranslation([bazukaTranslationX, bazukaTranslationY, bazukaTranslationZ])
        multRotationZ(bazukaRotationZ)
        multScale([bazukaScaleX, bazukaScaleY, bazukaScaleZ])

        uploadModelView();

        paint(DARK_PURPLE);
        CYLINDER.draw(gl, program, mode);
    }

    function bazukaBelt(){
        multTranslation([bazukaBeltTranslationX, bazukaBeltTranslationY, bazukaBeltTranslationZ])
        multRotationZ(bazukaBeltRotationZ)
        multScale([bazukaBeltScaleX, bazukaBeltScaleY, bazukaBeltScaleZ])

        uploadModelView();

        paint(WEIRD_PINK);

        CYLINDER.draw(gl, program, mode);
    }

    function bazukaSleeve(){
        multTranslation([bazukaSleeveTranslationX, bazukaSleeveTranslationY, bazukaSleeveTranslationZ])
        multRotationZ(bazukaSleeveRotationZ)
        multScale([bazukaSleeveScaleX, bazukaSleeveScaleY, bazukaSleeveScaleZ])

        uploadModelView();

        paint(WEIRD_PINK);

        TORUS.draw(gl, program, mode);
    }

    function hatchet() {
        multTranslation([hatchetTranslationX,hatchetTranslationY,hatchetTranslationZ]);
        multScale([hatchetScaleX,hatchetScaleY,hatchetScaleZ]);
        uploadModelView();

        paint(WHITE);
        SPHERE.draw(gl, program, mode);
    }

    function projectile() {
        //console.log("X is NaN:" + isNaN(parseFloat(bulletX)) + ". Value is " + bulletX);
        multTranslation([5.3+bulletX, 2.6-bulletY, 1.5]);
        multScale([0.2,0.2,0.2]);
        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(0,0,0,1.0));
        SPHERE.draw(gl, program, mode);
    }

    function resetProjectileVar(){
        velocityX = fireVelocity;
        velocityY = 0;
        bulletX = 0;
        bulletY = 0;

    }

    function updateVelocity(dt) {
        console.log("velocityX is "+ velocityX);
        console.log("velocityY is "+ velocityY);
        velocityX += gForce * dt;
        velocityY += gForce * dt;
    }

    function updatePosition(dt) {
        console.log("bulletX is "+ bulletX);
        console.log("bulletY is "+ bulletY);
        bulletX += velocityX * dt + (gForce * Math.pow(dt,2)*0.5);
        bulletY += velocityY * dt + (gForce * Math.pow(dt,2)*0.5);
    }

    function drawWheels(){
        for(let i=0; i<4;i++){
            for(let j=0; j<=3;j+=3){
                pushMatrix();
                wheel(i,j);
                popMatrix();
            }
        }
    }

    function drawRims(){
        for(let i=0; i<4;i++){
            for(let j=0; j<=3;j+=3){
                pushMatrix();
                tankRim(i,j);
                popMatrix();
            }
        }
    }

    function drawAxles(){
        for(let i=0; i<4;i++){
            pushMatrix()
            tankAxle(i);
            popMatrix();
        }
    }

    function drawProjectile(){
        pushMatrix()
       /* if(movementHead != 0){
            multTranslation([1.5,0,1.5]);
            multRotationY(movementHead);
            multTranslation([-1.5,0,-1.5]);
        }*/
        multTranslation([1.7,2.5,0]);
        multRotationZ(bazukaAngle);
        multTranslation([-1.7,-2.5,0]);
        projectile();
        popMatrix()
    }

    function drawTank(){
        pushMatrix()
        drawWheels();
        popMatrix()

        pushMatrix()
        drawRims();
        popMatrix()

        pushMatrix()
        drawAxles();
        popMatrix()

        pushMatrix()
        tankBody();
        popMatrix()

        pushMatrix()
        drawHead();
        popMatrix()    
        
        pushMatrix()
        grill1();
        popMatrix()

        pushMatrix()
        grill2();
        popMatrix()

        pushMatrix()
        grill3();
        popMatrix()

        /*if(bullet){
            //bullet = false;
            drawProjectile();
        }*/

    }

    function drawHead(){
        if(movementHead != 0){
            multTranslation([1.5,0,1.5]);
            multRotationY(movementHead);
            multTranslation([-1.5,0,-1.5]);
        }
        
        pushMatrix()
        tankHead();
        popMatrix()

        pushMatrix()
        top_back_appendice();
        popMatrix()

        pushMatrix()
        antenna1();
        popMatrix()

        pushMatrix()
        antenna2();
        popMatrix()

        pushMatrix()
        multTranslation([1.7,2.5,0]);
        multRotationZ(bazukaAngle);
        multTranslation([-1.7,-2.5,0]);
        bazuka();
        popMatrix()

        pushMatrix()
        multTranslation([1.7,2.5,0]);
        multRotationZ(bazukaAngle);
        multTranslation([-1.7,-2.5,0]);
        bazukaBelt();
        popMatrix()

        pushMatrix()
        hatchet();
        popMatrix()

        pushMatrix()
        multTranslation([1.7,2.5,0]);
        multRotationZ(bazukaAngle);
        multTranslation([-1.7,-2.5,0]);
        bazukaSleeve();
        popMatrix()

    }

    function testDrawProjectile(){
        pushMatrix()
        if(bulletPos1 != 0){
            multTranslation([1.5,0,1.5]);
            multRotationY(bulletPos1);
            multTranslation([-1.5,0,-1.5]);
        }
        if(bulletPos2 != 0){
            multTranslation([1.7,2.5,0]);
            multRotationZ(bulletPos2);
            multTranslation([-1.7,-2.5,0]);
        }

        projectile();
        //bullet = false;
        popMatrix()
    }


    function render()
    {
        if(animation) {
            //bulletLoc += 0.1;
            //bulletHeight += 0.1;
        }

       

        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
    
        loadMatrix(view);
        
        pushMatrix()
            drawFloor();
        popMatrix();

        multTranslation([-1.5,0,-1.5]);
        multTranslation([movementTank,0,0]);
        drawTank()
        
        if(bullet) {
            var dt = (new Date().getTime() - time) /1000; //seconds
            //console.log("Delta time is " + dt);
            //console.log("Time is "+ time);
            time = new Date().getTime(); //reset t 
    
            updateVelocity(dt);
            updatePosition(dt);
            testDrawProjectile();

            if((2.6-bulletY) <= 0){
                bullet = false;
                resetProjectileVar();
            }
        }
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))