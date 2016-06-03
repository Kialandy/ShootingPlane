
var player;

//Khai báo thông tin chung của các thực thể (Upgrade, Bullet, Actor)
Entity = function(type,id,x,y,width,height,img){
	var self = {
		type:type,
		id:id,
		x:x,
		y:y,
		width:width,
		height:height,
		img:img,
	};
	//Gọi các hàm Entity (Ham xy ly chuyen dong va ve thuc the.)
	self.update = function(){
		self.updatePosition();
		self.draw();
	}
	//Gọi hàm vẽ ảnh các đối tượng.
	self.draw = function(){
		ctx.save();
		var x = self.x - player.x;
		var y = self.y - player.y;
		
		x += WIDTH/2;
		y += HEIGHT/2;
		
		x -= self.width/2;
		y -= self.height/2;
		
		//Vẽ entity
		ctx.drawImage(self.img,
			0,0,self.img.width,self.img.height,
			x,y,self.width,self.height
		);
		
		ctx.restore();
	}
	//Tinh va tra ve khoang cach giua 2 thuc the (entity). Tra ve khoang cach (number)
	self.getDistance = function(entity2){	
		var vx = self.x - entity2.x;
		var vy = self.y - entity2.y;
		return Math.sqrt(vx*vx+vy*vy);
	}
	//Kiem tra su va cham giua 2 thuc the. Tra ve colliding gia tri true/fale
	self.testCollision = function(entity2){	
		var rect1 = {
			x:self.x-self.width/2,
			y:self.y-self.height/2,
			width:self.width,
			height:self.height,
		}
		var rect2 = {
			x:entity2.x-entity2.width/2,
			y:entity2.y-entity2.height/2,
			width:entity2.width,
			height:entity2.height,
		}
		return testCollisionRectRect(rect1,rect2);
		
	}
	self.updatePosition = function(){}
	
	return self;
}

//Khai báo lớp thông tin người chơi. Kế thừa từ Actor
Player = function(){
	var self = Actor('player','myId',50,40,50,70,Img.player,10,1);
	
	
	var super_update = self.update;
	//Gọi các hàm xử lý chuyển động khi nhấn bàn phím
	self.update = function(){
		super_update();
		if(self.pressingRight || self.pressingLeft || self.pressingDown || self.pressingUp)
			self.spriteAnimCounter += 0.2;
		if(self.pressingMouseLeft)
			self.performAttack();
		if(self.pressingMouseRight)
			self.performSpecialAttack();
	}	
	//Xu ly chuyen dong thuc the khi va cham vao cac canh canvas
	self.updatePosition = function(){
		//Cập nhật vị trí mới của người chơi khi nhấn di chuyển bằng bàn phím.
		if(self.pressingRight)
			self.x += 10;
		if(self.pressingLeft)
			self.x -= 10;	
		if(self.pressingDown)
			self.y += 10;	
		if(self.pressingUp)
			self.y -= 10;	
		
		//Giới hạn di chuyen trong khu canvas.
		if(self.x < self.width/2)
			self.x = self.width/2;
		if(self.x > Maps.current.width-self.width/2)
			self.x = Maps.current.width - self.width/2;
		if(self.y < self.height/2)
			self.y = self.height/2;
		if(self.y > Maps.current.height - self.height/2)
			self.y = Maps.current.height - self.height/2;
	}
	//Khi Hp người chơi về 0
	self.onDeath = function(){
		var timeSurvived = Date.now() - timeWhenGameStarted;		
		console.log("Thất bại! Điểm số đạt được: " + timeSurvived + " ms.");		
		startNewGame();
	}
	self.pressingDown = false;
	self.pressingUp = false;
	self.pressingLeft = false;
	self.pressingRight = false;
	
	self.pressingMouseLeft = false;
	self.pressingMouseRight = false;
	
	return self;
	
}

//Tạo lớp kế thừa từ Entity
Actor = function(type,id,x,y,width,height,img,hp,atkSpd){
	var self = Entity(type,id,x,y,width,height,img);
	
	self.hp = hp;
	self.hpMax = hp;
	self.atkSpd = atkSpd;
	self.attackCounter = 0;
	self.aimAngle = 0;
	
	self.spriteAnimCounter = 0;
	
	self.draw = function(){
		ctx.save();
		var x = self.x - player.x;
		var y = self.y - player.y;
		
		x += WIDTH/2;
		y += HEIGHT/2;
		
		x -= self.width/2;
		y -= self.height/2;
		
		var frameWidth = self.img.width/3;
		var frameHeight = self.img.height/4;
		
		var aimAngle = self.aimAngle;
		if(aimAngle < 0)
			aimAngle = 360 + aimAngle;
		
		//Vẽ hướng nhân vật khi di chuyển
		var directionMod = 3;	//hướng phải
		if(aimAngle >= 45 && aimAngle < 135)	//trên
			directionMod = 2;
		else if(aimAngle >= 135 && aimAngle < 225)	//trái
			directionMod = 1;
		else if(aimAngle >= 225 && aimAngle < 315)	//dưới
			directionMod = 0;
		
		//Khoảng cách đi được của player
		var walkingMod = Math.floor(self.spriteAnimCounter) % 3;//1,2
		
		ctx.drawImage(self.img,
			walkingMod*frameWidth,directionMod*frameHeight,frameWidth,frameHeight,
			x,y,self.width,self.height
		);
		
		ctx.restore();
	}
	
	var super_update = self.update;
	self.update = function(){
		super_update();
		self.attackCounter += self.atkSpd;
		if(self.hp <= 0)
			self.onDeath();
	}
	self.onDeath = function(){};
	
	//Thực hiện lênh tấn công (chuột trái)
	self.performAttack = function(){
		if(self.attackCounter > 25){	//Mỗi 1s
			self.attackCounter = 0;
			Bullet.generate(self);
		}
	}
	//Lệnh tấn công đặc biệt (chuột phải)
	self.performSpecialAttack = function(){
		if(self.attackCounter > 50){	//Mỗi 1s 
			self.attackCounter = 0;
			/*
			for(var i = 0 ; i < 360; i++){
				Bullet.generate(self,i);
			}
			*/
			Bullet.generate(self,self.aimAngle - 5);
			Bullet.generate(self,self.aimAngle);
			Bullet.generate(self,self.aimAngle + 5);
		}
	}

	
	return self;
}

//Khai bác thông tin kẻ thù, kế thừa từ Actor
Enemy = function(id,x,y,width,height,img,hp,atkSpd){
	var self = Actor('enemy',id,x,y,width,height,img,hp,atkSpd);
	Enemy.list[id] = self;
	
	self.toRemove = false;
	
	var super_update = self.update; 
	self.update = function(){
		super_update();
		self.spriteAnimCounter += 0.2;
		self.updateAim();
		self.performAttack()
	}
	self.updateAim = function(){
		var diffX = player.x - self.x;
		var diffY = player.y - self.y;
		
		self.aimAngle = Math.atan2(diffY,diffX) / Math.PI * 180
	}
	
	//Vẽ các đối tượng quân địch
	var super_draw = self.draw; 
	self.draw = function(){
		super_draw();
		var x = self.x - player.x + WIDTH/2;
		var y = self.y - player.y + HEIGHT/2 - self.height/2 - 20;
		
		ctx.save();
		ctx.fillStyle = 'red';
		var width = 100*self.hp/self.hpMax;
		if(width < 0)
			width = 0;
		ctx.fillRect(x-50,y,width,10);
		
		ctx.strokeStyle = 'black';
		ctx.strokeRect(x-50,y,100,10);
		
		ctx.restore();
	
	}
	
	self.onDeath = function(){
		self.toRemove = true;
	}
	
	//Di chuyển tấn công player
	self.updatePosition = function(){
		var diffX = player.x - self.x;
		var diffY = player.y - self.y;
		
		if(diffX > 0)
			self.x += 3;
		else
			self.x -= 3;
			
		if(diffY > 0)
			self.y += 3;
		else
			self.y -= 3;
	
	}
}

Enemy.list = {};

Enemy.update = function(){
	if(frameCount % 100 === 0)	//Mỗi 4s gọi hàm randomlyGenerate
		Enemy.randomlyGenerate();
	for(var key in Enemy.list){
		Enemy.list[key].update();
	}
	for(var key in Enemy.list){
		if(Enemy.list[key].toRemove)
			delete Enemy.list[key];
	}
}

//Tạo ngẫu nhiên 1 kẻ thù
Enemy.randomlyGenerate = function(){
	//Math.random() tra ve 0 hoac 1
	var x = Math.random()*Maps.current.width;
	var y = Math.random()*Maps.current.height;
	var height = 64;
	var width = 64;
	var id = Math.random();
	if(Math.random() < 0.5)
		Enemy(id,x,y,width,height,Img.balloon,2,1);
	else
		Enemy(id,x,y,width,height,Img.aircraft,1,3);
}

//Khai báo thông tin cập nhật được (điểm số, tốc độ tấn công)
Upgrade = function (id,x,y,width,height,category,img){
	var self = Entity('upgrade',id,x,y,width,height,img);
	
	self.category = category;
	Upgrade.list[id] = self;
}

Upgrade.list = {};

//Hàm cập nhật score + atkSpd
Upgrade.update = function(){
	if(frameCount % 75 === 0)	//Mỗi 3s gọi hàm randomlyGenerate
		Upgrade.randomlyGenerate();
	for(var key in Upgrade.list){
		Upgrade.list[key].update();
		var isColliding = player.testCollision(Upgrade.list[key]);
		if(isColliding){
			if(Upgrade.list[key].category === 'score')
				score += 1000;
			if(Upgrade.list[key].category === 'atkSpd')
				player.atkSpd += 3;
			delete Upgrade.list[key];
		}
	}
}	

//Hàm tạo score + atkSpd
Upgrade.randomlyGenerate = function(){
	//Math.random() trả về giá trị 0 hoặc 1
	var x = Math.random()*Maps.current.width;
	var y = Math.random()*Maps.current.height;
	var height = 32;
	var width = 32;
	var id = Math.random();
	
	if(Math.random()<0.5){
		var category = 'score';
		var img = Img.upgrade1;
	} else {
		var category = 'atkSpd';
		var img = Img.upgrade2;
	}
	
	Upgrade(id,x,y,width,height,category,img);
}

//Lớp đạn đạo kế thừa từ Entity. Bao gồm các thông tin của viên đạn
Bullet = function (id,x,y,spdX,spdY,width,height,combatType){
	var self = Entity('bullet',id,x,y,width,height,Img.bullet);
	
	self.timer = 0;
	self.combatType = combatType;
	self.spdX = spdX;
	self.spdY = spdY
	
	self.updatePosition = function(){
		self.x += self.spdX;
		self.y += self.spdY;
				
		if(self.x < 0 || self.x > Maps.current.width){
			self.spdX = -self.spdX;
		}
		if(self.y < 0 || self.y > Maps.current.height){
			self.spdY = -self.spdY;
		}
	}
	
	
	Bullet.list[id] = self;
}

Bullet.list = {};

//Hàm update viên đạn
Bullet.update = function(){
	for(var key in Bullet.list){
		var b = Bullet.list[key];
		b.update();
		
		var toRemove = false;
		b.timer++;
		if(b.timer > 75){
			toRemove = true;
		}
		
		//Đạn được bắn ra từ player
		if(b.combatType === 'player'){	
			for(var key2 in Enemy.list){
				if(b.testCollision(Enemy.list[key2])){
					toRemove = true;
					Enemy.list[key2].hp -= 1;
				}				
			}
		}
		//Đạn được bắn ra từ quân địch	
		else if(b.combatType === 'enemy'){
			if(b.testCollision(player)){
				toRemove = true;
				player.hp -= 1;
			}
		}	
		
		
		if(toRemove){
			delete Bullet.list[key];
		}
	}
}

//Hàm hướng bắn của đạn
Bullet.generate = function(actor,aimOverwrite){
	//Math.random() tra ve 0 hoac 1
	var x = actor.x;
	var y = actor.y;
	var height = 24;
	var width = 24;
	var id = Math.random();
	
	//Biến lưu hướng bắn của đạn
	var angle;
	
	//Nếu đạn chạm vào góc
	if(aimOverwrite !== undefined)
		angle = aimOverwrite;
	else angle = actor.aimAngle;
	
	var spdX = Math.cos(angle/180*Math.PI)*5;
	var spdY = Math.sin(angle/180*Math.PI)*5;
	Bullet(id,x,y,spdX,spdY,width,height,actor.type);
}

