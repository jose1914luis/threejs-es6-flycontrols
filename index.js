/**
 * @author James Baicoianu / http://www.baicoianu.com/
 * transpiled by bitttttten <https://github.com/bitttttten>
 */

import { Quaternion, Vector3 } from 'three'

function contextmenu(event) {
	event.preventDefault();
}

module.exports = class FlyControls {
	constructor(object, domElement = document) {

		this.object = object;
		this.domElement = domElement;
		if (this.domElement !== document) {
			this.domElement.setAttribute('tabindex', -1);
		}

		// API
		this.movementSpeed = 1.0;
		this.rollSpeed = 0.005;
		this.dragToLook = false;
		this.autoForward = false;// internals

		// internals
		this.tmpQuaternion = new Quaternion();
		this.mouseStatus = 0;
		this.moveState = { up: 0, down: 0, left: 0, right: 0, forward: 0, back: 0, pitchUp: 0, pitchDown: 0, yawLeft: 0, yawRight: 0, rollLeft: 0, rollRight: 0 };
		this.moveVector = new Vector3(0, 0, 0);
		this.rotationVector = new Vector3(0, 0, 0);

		// binding
		this.onMouseMove = this.handleMouseMove.bind(this)
		this.onMouseDown = this.handleMouseDown.bind(this)
		this.onMouseUp = this.handleMouseUp.bind(this)
		this.onKeyDown = this.handleKeyDown.bind(this)
		this.onKeyUp = this.handleKeyUp.bind(this)

		// event listeners
		this.domElement.addEventListener('contextmenu', contextmenu, false);
		this.domElement.addEventListener('mousemove', this.onMouseMove, false);
		this.domElement.addEventListener('mousedown', this.onMouseDown, false);
		this.domElement.addEventListener('mouseup', this.onMouseUp, false);
		window.addEventListener('keydown', this.onKeyDown, false);
		window.addEventListener('keyup', this.onKeyUp, false );

		// first update
		this.updateMovementVector();
		this.updateRotationVector();
	}

	dispose() {
		this.domElement.removeEventListener('contextmenu', contextmenu, false);
		this.domElement.removeEventListener('mousedown', this.onMouseDown, false);
		this.domElement.removeEventListener('mousemove', this.onMouseMove, false);
		this.domElement.removeEventListener('mouseup', this.onMouseUp, false);

		window.removeEventListener('keydown', this.onKeyDown, false);
		window.removeEventListener('keyup', this.onKeyUp, false);
	}

	keyHandler(code, amount, movementSpeedMultiplier) {
		switch (code) {
			case 16: /* shift */ this.movementSpeedMultiplier = movementSpeedMultiplier; break;

			case 87: /*W*/ this.moveState.forward = amount; break;
			case 83: /*S*/ this.moveState.back = amount; break;

			case 65: /*A*/ this.moveState.left = amount; break;
			case 68: /*D*/ this.moveState.right = amount; break;

			case 82: /*R*/ this.moveState.up = amount; break;
			case 70: /*F*/ this.moveState.down = amount; break;

			case 38: /*up*/ this.moveState.pitchUp = amount; break;
			case 40: /*down*/ this.moveState.pitchDown = amount; break;

			case 37: /*left*/ this.moveState.yawLeft = amount; break;
			case 39: /*right*/ this.moveState.yawRight = amount; break;

			case 81: /*Q*/ this.moveState.rollLeft = amount; break;
			case 69: /*E*/ this.moveState.rollRight = amount; break;
		}
		this.updateMovementVector();
		this.updateRotationVector();
	}

	handleKeyDown(event) {
		if (event.altKey) {
			return
		}
		this.keyHandler(event.keyCode, 1, .1)
	}

	handleKeyUp(event) {
		this.keyHandler(event.keyCode, 0, 1)
	}

	handleMouseDown(event) {
		if (this.domElement !== document) {
			this.domElement.focus();
		}

		event.preventDefault();
		event.stopPropagation();

		if (this.dragToLook) {
			this.mouseStatus++;
		} else {
			switch (event.button ) {
				case 0: this.moveState.forward = 1; break;
				case 2: this.moveState.back = 1; break;
			}
			this.updateMovementVector();
		}
	}

	handleMouseMove(event) {
		if (!this.dragToLook || this.mouseStatus > 0) {
			var container = this.getContainerDimensions();
			var halfWidth  = container.size[ 0 ] / 2;
			var halfHeight = container.size[ 1 ] / 2;

			this.moveState.yawLeft   = - ( ( event.pageX - container.offset[ 0 ] ) - halfWidth  ) / halfWidth;
			this.moveState.pitchDown =   ( ( event.pageY - container.offset[ 1 ] ) - halfHeight ) / halfHeight;

			this.updateRotationVector();
		}
	}

	handleMouseUp(event) {
		event.preventDefault();
		event.stopPropagation();

		if (this.dragToLook) {
			this.mouseStatus--;
			this.moveState.yawLeft = this.moveState.pitchDown = 0;
		} else {
			switch (event.button) {
				case 0: this.moveState.forward = 0; break;
				case 2: this.moveState.back = 0; break;
			}
			this.updateMovementVector();
		}

		this.updateRotationVector();
	}

	update(delta) {
		var moveMult = delta * this.movementSpeed;
		var rotMult = delta * this.rollSpeed;

		this.object.translateX(this.moveVector.x * moveMult);
		this.object.translateY(this.moveVector.y * moveMult);
		this.object.translateZ(this.moveVector.z * moveMult);

		this.tmpQuaternion.set(this.rotationVector.x * rotMult, this.rotationVector.y * rotMult, this.rotationVector.z * rotMult, 1).normalize();
		this.object.quaternion.multiply(this.tmpQuaternion);

		// expose the rotation vector for convenience
		this.object.rotation.setFromQuaternion(this.object.quaternion, this.object.rotation.order);
	}

	updateMovementVector() {
		var forward = ( this.moveState.forward || (this.autoForward && ! this.moveState.back) ) ? 1 : 0;

		this.moveVector.x = -this.moveState.left + this.moveState.right;
		this.moveVector.y = -this.moveState.down + this.moveState.up;
		this.moveVector.z = -forward + this.moveState.back;
	}

	updateRotationVector() {
		this.rotationVector.x = (-this.moveState.pitchDown + this.moveState.pitchUp);
		this.rotationVector.y = (-this.moveState.yawRight  + this.moveState.yawLeft);
		this.rotationVector.z = (-this.moveState.rollRight + this.moveState.rollLeft);
	}

	getContainerDimensions() {
		if (this.domElement !== document) {
			return {
				size : [ this.domElement.offsetWidth, this.domElement.offsetHeight ],
				offset : [ this.domElement.offsetLeft,  this.domElement.offsetTop ]
			}
		} else {
			return {
				size : [ window.innerWidth, window.innerHeight ],
				offset : [ 0, 0 ]
			}
		}
	}
}
