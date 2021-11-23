import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, vec4, mult} from "../../libs/MV.js";
import {modelView, loadMatrix, multRotationY, multScale, multTranslation, popMatrix, pushMatrix, multRotationZ, multRotationX} from "../../libs/stack.js";

import * as PYRAMID from '../../libs/pyramid.js';
import * as CUBE from '../../libs/cube.js';
import * as CYLINDER from '../../libs/cylinder.js';
import * as TORUS from '../../libs/torus.js';
//import { draw } from "./libs/torus.js";


/** @type WebGLRenderingContext */
let gl;

let time = 0;           // Global simulation time in days
let speed = 1/60.0;     // Speed (how many days added to time on each render pass
let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
let animation = true;   // Animation is running

const VP_DISTANCE = 5;

let view = lookAt([0,0,0], [0,0,0], [1,1,0]);


let movementTank = 0;
let movementWheels = 0;
//ADDED VARIABLE TO MAKE BAZUKA GO UP AND DOWN NOT WORKING YET!
let bazukaAngle = 0;
//ADDED VARIABLE TO MAKE ROTATE NOT WORKING YET!
let movementHead = 0;




function setup(shaders)
{
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    gl = setupWebGL(canvas);

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    let mProjection = ortho(-VP_DISTANCE*aspect,VP_DISTANCE*aspect, -VP_DISTANCE, VP_DISTANCE,-3*VP_DISTANCE,3*VP_DISTANCE);
    

    mode = gl.LINES; 

    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    document.onkeydown = function(event) {
        switch(event.key) {
            case 'w':
                bazukaAngle+=0.5;
                break;
            case 'W':
                mode = gl.LINES; 
                break;
            case 's':
                bazukaAngle-=0.5;
                break;
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
            case '+':
                if(animation) speed *= 1.1;
                break;
            case '-':
                if(animation) speed /= 1.1;
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
    TORUS.init(gl);
    //SPHERE.init(gl);
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
    
        multScale([1, 0.01, 1]);
        multTranslation([i,0,j]);

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
        multRotationY(-movementWheels);

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(0.0,0.0,0.0,1.0));
        CYLINDER.draw(gl, program, mode);
    }

    
    function tankRim(i,j){
        multTranslation([i,0.5,j])
        multScale([0.6,0.6,0.51])
        multRotationX(90)
        multRotationY(-movementWheels)
        
        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(0.6,0.6,0.0,1.0));
        CYLINDER.draw(gl, program, mode);
    }

    function tankAxle(i){

        multTranslation([i,0.5,1.5])
        multRotationX(90)
        multScale([0.3,3,0.3])
        multRotationY(-movementWheels);

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

    function body_front_prism(){
        multTranslation([1.82,-2,0])
        multRotationZ(-90)
        multScale([3,1.5,2])

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(0.75,0.78,0.99,1.0));
        PYRAMID.draw(gl, program, mode);
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
        //gl.uniform4fv(color, vec4(0.5, 0.6, 0.8,1.0));
        CUBE.draw(gl, program, mode);
    }

    function top_back_appendice() {

        multTranslation([0.5, 2.75, 1.5])
        multScale([0.2, 0.5, 0.8])

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(1.0, 1.0, 1.0, 1.0));
        CUBE.draw(gl, program, mode);
    }

    function top_front_appendice(){
        multTranslation([2.5, 2.6, 1.5])
        multScale([0.3, 0.2, 0.5])

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(1.0, 1.0, 1.0, 1.0));
        CUBE.draw(gl, program, mode);
    }

    function top_bazuka(){
        multTranslation([3.9, 2.6, 1.5])
        multRotationZ(90)
        multScale([0.16, 2.5, 0.16])

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(0.64,0.65,0.84,1.0));
        CYLINDER.draw(gl, program, mode);
    }

    function bazuka_belt1(){
        multTranslation([3.1,2.25,1.5])
        multRotationZ(90)
        multScale([0.4, 0.2, 0.4])

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(1.0,1.0,1.0,1.0));
        CYLINDER.draw(gl, program, mode);
    }

   
    function bottom_bazuka(){
        multTranslation([4.75, 2.28, 1.5])
        multRotationZ(91)
        multScale([0.25, 3.5, 0.25])

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4(0.64,0.65,0.84,1.0));
        CYLINDER.draw(gl, program, mode);
    }

    function bazuka_belt2(){
        multTranslation([2.7, 2.6, 1.5])
        multRotationZ(90)
        multScale([0.21, 0.1, 0.21])

        uploadModelView();

        const color = gl.getUniformLocation(program, "fColor");
        gl.uniform4fv(color, vec4( 0.847059 , 0.847059 , 0.77902, 1.0));
        CYLINDER.draw(gl, program, mode);
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


    function render()
    {
        //if(animation) time += speed;
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.useProgram(program);
        
        gl.uniformMatrix4fv(gl.getUniformLocation(program, "mProjection"), false, flatten(mProjection));
    
        loadMatrix(view);
        
        pushMatrix()
            drawFloor();
        popMatrix();

        pushMatrix()
            multTranslation([movementTank,0,0]);
            pushMatrix();
                drawWheels();
            popMatrix();

            pushMatrix()
                drawRims();
            popMatrix();

            pushMatrix()
                drawAxles();
            popMatrix();
            pushMatrix()
                tankBody();
            popMatrix()
            pushMatrix()
                //TODO TRIED MAKING TANK HEAD ROTATE BUT COULDNT NEEDS TO BE FIXED!
                multRotationY(movementHead);
                pushMatrix()
                tankHead();
                //body_front_prism();
                popMatrix()
                pushMatrix()
                    top_back_appendice();
                popMatrix()
                pushMatrix()
                    top_front_appendice();
                popMatrix()
                pushMatrix()
                    top_bazuka();
                popMatrix()
                pushMatrix()
                    multRotationZ(bazukaAngle);
                    bottom_bazuka();
                popMatrix()
                pushMatrix()
                    bazuka_belt1();
                popMatrix()
                pushMatrix()
                    bazuka_belt2();
                popMatrix()
            popMatrix
        popMatrix()

        

        /*pushMatrix()
            tankHead();
            //body_front_prism();
        popMatrix()

        pushMatrix()
            top_back_appendice();
        popMatrix()

        pushMatrix()
            top_front_appendice();
        popMatrix()

        pushMatrix()
            top_bazuka();
        popMatrix()

        pushMatrix()
            bottom_bazuka();
        popMatrix()
        
        pushMatrix()
            bazuka_belt1();
        popMatrix()

        pushMatrix()
            bazuka_belt2();
        popMatrix()*/
        

    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))