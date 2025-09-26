async function getRoomsData() {
  const url = "http://localhost:8000/rooms";
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    console.log(result);
  } catch (error) {
    console.error(error.message);
  }
}

function retriveRoomData(duration, callback) {
  this.callback = callback;
  this.duration = duration;
  this.elapsed = 0;
}

retriveRoomData.prototype.start = function () {
  this.interval = setInterval(() => {
    this.elapsed++;
    //console.log(`${this.elapsed}`);
    if (this.elapsed >= this.duration) {
      this.elapsed = 0;
      this.callback();
    }
  }, 1000);
};
retriveRoomData.prototype.stop = function () {
  if (this.interval) clearInterval(this.interval);
};
const _get = new retriveRoomData(1, () => getRoomsData());
_get.start();
