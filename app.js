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

let VP_DISTANCE = 5;

let view = lookAt([0,1,0], [0,0,0], [1,1,0]);


let movementTank = 0;
let movementWheels = 0;
//ADDED VARIABLE TO MAKE BAZUKA GO UP AND DOWN NOT WORKING YET!
let bazukaAngle = 0;
//ADDED VARIABLE TO MAKE ROTATE NOT WORKING YET!
let movementHead = 0;
const bazukaAngleMIN = 0.0;
const bazukaAngleMAX = 30;

let bullet = false;
let bulletLoc = 0;
let bulletHeight = 0;
let bulletPos1;
let bulletPos2;
let velocityX=0;
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
            case '+':
                if(VP_DISTANCE>3)
                    VP_DISTANCE--;
                mProjection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);
                break;
            case '-':
                if(VP_DISTANCE<10)
                    VP_DISTANCE++;
                mProjection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);
                break;
            case 'w':
                if(bazukaAngle == bazukaAngleMAX)
                    break;
                else{
                    bazukaAngle+=0.5;
                    break;
                }
            case 'W':
                mode = gl.LINES; 
                break;
            case 's':
                if(bazukaAngle == bazukaAngleMIN)
                    break;
                else{
                    bazukaAngle-=0.5;
                    break;
                }
            case 'S':
                mode = gl.TRIANGLES;
                break;
            case 'a':
                movementHead+= +0.5;
                break;
            case 'd':
                movementHead+= -0.5;
                break;
            case 'p':
                animation = !animation;
                break;
            case ' ':
                console.log("works");
                bullet = true;
                bulletLoc = 0;
                bulletPos1 = movementHead;
                bulletPos2 = bazukaAngle;
                time = new Date().getTime();
                break;
            case 'ArrowUp':
                movementTank+= 0.1;
                movementWheels+=1;
                break;
            case 'ArrowDown':
                movementTank-= 0.1;
                movementWheels-=1;
                break;
            case '1':
                view = lookAt([-0.5,0,0], [0,0,0], [1,1,0]);
                break;
            case '2':
                view = lookAt([0,1,0], [0,0,0], [1,1,0]);
                break;
            case '3':
                view = lookAt([0,0,0], [0,0,0], [1,1,0]);
                break;
            case '4':
                view = lookAt([3,3,3], [0,0,0], [1,2,1]);
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
    
        multScale([1, 0.4, 1]);
        multTranslation([i,-0.5,j]);

        const color = gl.getUniformLocation(program, "fColor");

        if((i+j)%2==0)
            gl.uniform4fv(color, vec4(0.7,1.0,1.0,1.0));
        else
            gl.uniform4fv(color, vec4(0.8,0.7,0.8,1.0));
    
        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a sphere representing the sun
        CUBE.draw(gl, program, mode);
    }


    function wheel(i,j){
        multTranslation([i,0.5,j])
        multScale([1,1,0.5])
        multRotationX(90)
        multRotationY(-((movementWheels*360) / Math.PI));

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(0.0,0.0,0.0,1.0));
        CYLINDER.draw(gl, program, mode);
    }

    
    function tankRim(i,j){
        multTranslation([i,0.5,j])
        multScale([0.6,0.6,0.51])
        multRotationX(90)
        multRotationY(-((movementWheels*360) / Math.PI))
        
        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(0.847059 , 0.847059 , 0.77902, 1.0));
        CYLINDER.draw(gl, program, mode);
    }

    function tankAxle(i){

        multTranslation([i,0.5,1.5])
        multRotationX(90)
        multScale([0.3,3,0.3])
        multRotationY(-((movementWheels*360) / Math.PI));

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(0.6,0.6,0.6,1.0));
        CYLINDER.draw(gl, program, mode);
    }


    function tankBody(){

        multTranslation([1.5,1.25,1.5])
        multScale([5,1.5,4])

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(0.75,0.78,0.99,1.0));
        CUBE.draw(gl, program, mode);
    }

    function antenna1(){
        multTranslation([0.2,3.5,0.7])
        multRotationX(-10)
        multScale([0.01,3,0.01])

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(0,0.,0,1.0));
        CYLINDER.draw(gl, program, mode);
    }

    function antenna2(){
        multTranslation([0.2,3.5,2.3])
        multRotationX(10)
        multScale([0.01,3,0.01])

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(0,0,0,1.0));
        CYLINDER.draw(gl, program, mode);
    }

    function grill1(){
        multTranslation([-1.001,1.7,1.5])
        multRotationY(90)
        multRotationZ(90)
        multScale([0.01,2,0.01])

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(0,0,0,1))
        CYLINDER.draw(gl, program, mode);
    }

    function grill2(){
        multTranslation([-1.001,1.5,1.5])
        multRotationY(90)
        multRotationZ(90)
        multScale([0.01,1.7,0.01])

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(0,0,0,1))
        CYLINDER.draw(gl, program, mode);
    }

    function grill3(){
        multTranslation([-1.001,1.3,1.5])
        multRotationY(90)
        multRotationZ(90)
        multScale([0.01,1.4,0.01])

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(0,0,0,1))
        CYLINDER.draw(gl, program, mode);
    }

    //TODO
    function tankBody2(){
        
       // multTranslation([4.5,1.25,0])
        //multRotationZ(-90)
        multScale([5,1,1])

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(0.74902,0.847059,0.847059,1.0));
        PYRAMID.draw(gl, program, mode);
    }

    function tankHead(){

        multTranslation([1.5,2.25,1.5])   
        multScale([3,0.5,2])

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4( 0.847059 , 0.847059 , 0.77902, 1.0));
        CUBE.draw(gl, program, mode);
    }

    function top_back_appendice() {

         
        multTranslation([0.5, 2.75, 1.5])
        //multTranslation([0.6,0.5,0])
        multScale([0.2, 0.5, 0.8])

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(1.0, 1.0, 1.0, 1.0));
        CUBE.draw(gl, program, mode);
    }

    function top_bazuka(){
        
        multTranslation([3.5, 2.6, 1.5])
        multRotationZ(90)
        multScale([0.16, 3.7, 0.16])

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(0.64,0.65,0.84,1.0));
        CYLINDER.draw(gl, program, mode);
    }

    function bazuka_belt2(){
        multTranslation([2.6, 2.6, 1.5])
        multRotationZ(90)
        multScale([0.21, 0.5, 0.21])

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(0.8,0.7,0.8,1.0));
        CYLINDER.draw(gl, program, mode);
    }

    function bazuka_sleeve2(){
        multTranslation([4.8, 2.6, 1.5])
        multRotationZ(90)
        multScale([0.21, 3, 0.21])

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(0.8,0.7,0.8,1.0));
        TORUS.draw(gl, program, mode);
    }
   

    function hatchet() {
        multTranslation([1.7,2.5,1.5]);
        multScale([1.5,1.5,1.5]);
        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(1.0,1.0,1.0,1.0));
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
        velocityX = initialV * Math.cos(bazukaAngle);
        velocityY = initialV * Math.sin(bazukaAngle);
        
        accelX = 0;
        accelY = 0;

        bulletX = 0;
        bulletY = 0;

    }

    function updateVelocity(dt) {
        console.log("velocity is "+ velocityX);
        velocityX += gForce * dt;
        velocityY += gForce * dt;
    }

    function updatePosition(dt) {
        console.log("bulletX is "+ bulletX);
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
        top_bazuka();
        popMatrix()

        pushMatrix()
        multTranslation([1.7,2.5,0]);
        multRotationZ(bazukaAngle);
        multTranslation([-1.7,-2.5,0]);
        bazuka_belt2();
        popMatrix()

        pushMatrix()
        hatchet();
        popMatrix()

        pushMatrix()
        multTranslation([1.7,2.5,0]);
        multRotationZ(bazukaAngle);
        multTranslation([-1.7,-2.5,0]);
        bazuka_sleeve2();
        popMatrix()

        /*pushMatrix()
        multTranslation([1.7,2.5,0]);
        multRotationZ(bazukaAngle);
        multTranslation([-1.7,-2.5,0]);
        projectile();
        popMatrix()*/

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
        }
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))