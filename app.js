import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, vec4} from "../../libs/MV.js";
import {modelView, loadMatrix, multRotationY, multScale, multTranslation, popMatrix, pushMatrix, multRotationZ} from "../../libs/stack.js";

import * as SPHERE from '../../libs/sphere.js';
import * as CUBE from '../../libs/cube.js';

/** @type WebGLRenderingContext */
let gl;

let time = 0;           // Global simulation time in days
let speed = 1/60.0;     // Speed (how many days added to time on each render pass
let mode;               // Drawing mode (gl.LINES or gl.TRIANGLES)
let animation = true;   // Animation is running

const PLANET_SCALE = 10;    // scale that will apply to each planet and satellite
const ORBIT_SCALE = 1/60;   // scale that will apply to each orbit around the sun
const EARTH_ORBIT = 149570000*ORBIT_SCALE;


const VP_DISTANCE = 5;

let view = lookAt([3,3,3], [0,0,0], [1,2,1]);



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
                mode = gl.LINES; 
                break;
            case 's':
                mode = gl.TRIANGLES;
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
        }
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    CUBE.init(gl);
    //TODO
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
                Cube(i,j);
                popMatrix();
            }
        }
    }

    function Cube(i, j)
    {
    
        multScale([1, 0.2, 1]);
        multTranslation([i,0,j]);

        if((i+j)%2==0){
            const colorr = gl.getUniformLocation(program, "fColor");
            gl.uniform4fv(colorr, vec4(0.7,1.0,1.0,1.0));
        } else{
            const colorr = gl.getUniformLocation(program, "fColor");
            gl.uniform4fv(colorr, vec4(0.8,0.7,0.8,1.0));
        }
    


        // Send the current modelview matrix to the vertex shader
        uploadModelView();

        // Draw a sphere representing the sun
        CUBE.draw(gl, program, mode);
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

    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))