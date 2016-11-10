﻿var fc = null;


var FCUse_FileReader;


window.addEventListener('load', FCSet, false);


function FCFileChange(e) {
	FCFileRead(e.target.files[0]);
}


var File = null;
function FCFileRead(file) {
	File = file;
	var reader = new FileReader();
	reader.onload = function (e) {
		FCRomChange(e.target.result);
	};
	reader.readAsArrayBuffer(file);
}


function FCPause() {
	if(fc.Pause()) {
		document.getElementById("pause").disabled = true;
		document.getElementById("start").disabled = false;
	}
}


function FCStart() {
	if(fc.Start()) {
		document.getElementById("pause").disabled = false;
		document.getElementById("start").disabled = true;
	}
}


function FCReset() {
	if(fc.Reset()) {
		document.getElementById("pause").disabled = false;
		document.getElementById("start").disabled = true;
	}
}


function ParseRom(argrom) {
	var rom = argrom.slice(0);
	if(rom < 0x10)
		return {"rom": rom, "type": 0};//??

	if(rom[0] == 0x4E && rom[1] == 0x45 && rom[2] == 0x53 && rom[3] == 0x1A) {
		if(rom.length == 40976) {
			if(rom[0x6010] == 0x00 && rom[0x6011] == 0x38 &&  rom[0x6012] == 0x4C && rom[0x6013] == 0xC6) {
				rom[6] = 0x40;
				rom[7] = 0x10;
				return {"rom": rom, "type": 2};//May Be FDS BIOS
			}
		}
		return {"rom": rom, "type": 1};//Nes Rom
	}

	if(rom.length == 8192) {
		if(rom[0] == 0x00 && rom[1] == 0x38 &&  rom[2] == 0x4C && rom[3] == 0xC6) {
			var padd = new Array(24 * 1024);
			for(var i=0; i<padd.length; i++)
				padd[i] = 0x00;
			var head = [0x4E, 0x45, 0x53, 0x1A, 0x02, 0x01, 0x40, 0x10, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
			rom = head.concat(padd).concat(rom).concat(padd.slice(0, 8192));
			return {"rom": rom, "type": 2};//May Be FDS BIOS
		}
	}

	if(rom[0] == 0x46 && rom[1] == 0x44 && rom[2] == 0x53 && rom[3] == 0x1A) {
		return {"rom": rom, "type": 3};//FDS Disk
	}

	if((rom.length % 65500) == 0) {
		var head =[0x46, 0x44, 0x53, 0x1A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
		rom = head.concat(rom);
		rom[4] = (rom.length - 16) / 65500;
		return {"rom": rom, "type": 3};//FDS Disk
	}

	return {"rom": rom, "type": 0};//??
}


function FCRomChange(changerom) {
	FCPause();

	var rom;
	var u8array = new Uint8Array(changerom);
	rom = new Array();
	for(var i=0; i<u8array.length; i++)
		rom.push(u8array[i]);

	var tmp = ParseRom(rom);

	document.getElementById("start").disabled = true;
	document.getElementById("pause").disabled = true;

	document.getElementById("insert").disabled = true;
	document.getElementById("eject").disabled = true;

	if(tmp.type == 0)
		return;

	if(tmp.type == 3) {
		if(fc.MapperNumber == 20) {
			document.getElementById("disk_filename").innerHTML = File.name;
			fc.Mapper.SetDisk(tmp.rom);
			FCStart();
			DiskSideCheck();
		}
		return;
	}

	document.getElementById("rom_filename").innerHTML = File.name;
	document.getElementById("disk_filename").innerHTML = "";
	fc.SetRom(tmp.rom);
	if(fc.Init())
		FCStart();
	DiskSideCheck();
}


function FCSetUp() {
	fc = new FC();
	return fc.SetCanvas("canvas0") ? true : false;
}


function FCSet() {
	if(!FCSetUp())
		return;

	FCUse_FileReader = typeof window.FileReader !== "undefined";
	if(FCUse_FileReader) {
		window.addEventListener("dragenter",
			function (e) {
				e.preventDefault();
			}, false);

		window.addEventListener("dragover",
			function (e) {
				e.preventDefault();
			}, false);

		window.addEventListener("drop",
			function (e) {
				e.preventDefault();
				FCFileRead(e.dataTransfer.files[0]);
			}, false);

		document.getElementById("file").addEventListener("change", FCFileChange, false);

		document.getElementById("pause").addEventListener("click", FCPause, false);
		document.getElementById("start").addEventListener("click", FCStart, false);
		document.getElementById("reset").addEventListener("click", FCReset, false);

		window.addEventListener("gamepadconnected", function(e) {
			if(e.gamepad.index == 0)
				document.getElementById("pad0state").innerHTML = "Gamepad 0 connected: " + e.gamepad.id;
			if(e.gamepad.index == 1)
				document.getElementById("pad1state").innerHTML = "Gamepad 1 connected: " + e.gamepad.id;
		});

		window.addEventListener("gamepaddisconnected", function(e) {
			if(e.gamepad.index == 0)
				document.getElementById("pad0state").innerHTML = "Gamepad 0 disconnected";
			if(e.gamepad.index == 1)
				document.getElementById("pad1state").innerHTML = "Gamepad 1 disconnected";
		});
		document.getElementById("pad0state").innerHTML = "Gamepad 0 disconnected";
		document.getElementById("pad1state").innerHTML = "Gamepad 1 disconnected";

		document.getElementById("insert").addEventListener("click", DiskInsert, false);
		document.getElementById("eject").addEventListener("click", DiskEject, false);

		//document.getElementById("sramout").addEventListener("click", SramOut, false);
		//document.getElementById("sramin").addEventListener("click", SramIn, false);

		//document.getElementById("statesave").addEventListener("click", StateSave, false);
		//document.getElementById("stateload").addEventListener("click", StateLoad, false);

		document.getElementById("start").disabled = true;
		document.getElementById("pause").disabled = true;

		document.getElementById("insert").disabled = true;
		document.getElementById("eject").disabled = true;

		document.getElementById("fullscreen").addEventListener("click",  FullScreen, false);
	}
}


function FullScreen() {
	var canvas = document.getElementById("canvas0");
	if(canvas.requestFullScreen)
		canvas.requestFullScreen();
	else if(canvas.webkitRequestFullScreen)
		canvas.webkitRequestFullScreen();
	else if(canvas.mozRequestFullScreen)
		canvas.mozRequestFullScreen();
}


function StateSave() {
	fc.GetState();
}


function StateLoad() {
	fc.SetState();
}


function SramOut() {
	var tmp = fc.Mapper.OutSRAM();
	document.getElementById("sramdata").value = tmp;
}


function SramIn() {
	fc.Mapper.InSRAM(document.getElementById("sramdata").value);
}


var DiskSideString = [" drop FDS Disk ", " EJECT ", " SIDE 1-A ", " SIDE 1-B ", " SIDE 2-A ", " SIDE 2-B "];
function DiskSideCheck() {
	document.getElementById("insert").disabled = true;
	document.getElementById("eject").disabled = true;

	if(fc.Mapper == null || fc.MapperNumber != 20)
		document.getElementById("diskside").innerHTML = " drop FDS BIOS ";
	else {
		var tmp = fc.Mapper.InDisk();
		tmp += 2;
		document.getElementById("diskside").innerHTML = DiskSideString[tmp];

		if(tmp != 0) {
			if(tmp == 1)
				document.getElementById("insert").disabled = false;
			else
				document.getElementById("eject").disabled = false;
		}
	}
}


function DiskInsert() {
	if(fc.Mapper == null || fc.MapperNumber != 20)
		return;
	var select = document.getElementById("diskselect");
	fc.Mapper.InsertDisk(parseInt(select.options[select.selectedIndex].value, 10));
	DiskSideCheck();
}


function DiskEject() {
	if(fc.Mapper == null || fc.MapperNumber != 20)
		return;
	fc.Mapper.EjectDisk();
	DiskSideCheck();
}
