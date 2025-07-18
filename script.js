class TargetGame {
    constructor() {
        this.score = 0;
        this.ammo = 30;
        this.currentWeapon = 'pistol';
        this.weapons = {
            pistol: { damage: 1, accuracy: 0.9, effect: 'pistol-effect' },
            shotgun: { damage: 3, accuracy: 0.7, effect: 'shotgun-effect' },
            ak: { damage: 2, accuracy: 0.8, effect: 'ak-effect' },
            sniper: { damage: 5, accuracy: 0.95, effect: 'sniper-effect' },
            bazooka: { damage: 10, accuracy: 0.6, effect: 'bazooka-effect' }
        };
        
        this.init();
    }
    
    init() {
        this.target = document.getElementById('target');
        this.gameArea = document.querySelector('.game-area');
        this.scoreElement = document.getElementById('score');
        this.ammoElement = document.getElementById('ammo');
        this.speechBubble = document.getElementById('speech-bubble');
        this.hitMarker = document.getElementById('hit-marker');
        this.bloodSplatter = document.getElementById('blood-splatter');
        this.explosionEffect = document.getElementById('explosion-effect');
        
        this.setupEventListeners();
        this.updateUI();
    }
    
    setupEventListeners() {
        // 게임 영역 클릭 이벤트
        this.gameArea.addEventListener('click', (e) => {
            if (this.ammo <= 0) {
                this.showMessage('총알이 없습니다! 재장전하세요!');
                return;
            }
            this.shoot(e);
        });
        
        // 무기 선택 버튼들
        document.querySelectorAll('.weapon-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectWeapon(e.target.dataset.weapon);
            });
        });
        
        // 재장전 버튼
        document.getElementById('reload-btn').addEventListener('click', () => {
            this.reload();
        });
        
        // 다시시작 버튼
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.restart();
        });
        
        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case '1': this.selectWeapon('pistol'); break;
                case '2': this.selectWeapon('shotgun'); break;
                case '3': this.selectWeapon('ak'); break;
                case '4': this.selectWeapon('sniper'); break;
                case '5': this.selectWeapon('bazooka'); break;
                case 'r': case 'R': this.reload(); break;
                case ' ': this.restart(); break;
            }
        });
    }
    
    shoot(e) {
        this.ammo--;
        this.updateUI();
        
        const rect = this.target.getBoundingClientRect();
        const targetCenterX = rect.left + rect.width / 2;
        const targetCenterY = rect.top + rect.height / 2;
        
        const clickX = e.clientX;
        const clickY = e.clientY;
        
        // 거리 계산
        const distance = Math.sqrt(
            Math.pow(clickX - targetCenterX, 2) + 
            Math.pow(clickY - targetCenterY, 2)
        );
        
        // 명중 여부 결정 (무기 정확도 고려)
        const weapon = this.weapons[this.currentWeapon];
        const maxDistance = rect.width / 2;
        const hitChance = weapon.accuracy;
        
        let hit = false;
        let points = 0;
        let hitLocation = '';
        
        if (Math.random() < hitChance) {
            if (distance <= maxDistance) {
                hit = true;
                
                // 명중 위치에 따른 점수 계산
                if (distance <= maxDistance * 0.1) {
                    points = 10; // 정중앙
                    hitLocation = 'center';
                } else if (distance <= maxDistance * 0.2) {
                    points = 8; // 내부 링
                    hitLocation = 'inner';
                } else if (distance <= maxDistance * 0.4) {
                    points = 5; // 중간 링
                    hitLocation = 'middle';
                } else if (distance <= maxDistance * 0.6) {
                    points = 3; // 외부 링
                    hitLocation = 'outer';
                } else {
                    points = 1; // 가장자리
                    hitLocation = 'edge';
                }
                
                // 중앙 보너스 (이전의 눈 맞추기 대신)
                const targetRect = this.target.getBoundingClientRect();
                const centerX = targetRect.left + targetRect.width / 2;
                const centerY = targetRect.top + targetRect.height / 2;
                const centerDistance = Math.sqrt(
                    Math.pow(clickX - centerX, 2) + 
                    Math.pow(clickY - centerY, 2)
                );
                
                if (centerDistance <= 30) { // 중앙 30px 반경
                    points += 5;
                    hitLocation = 'center';
                }
                
                this.score += points;
                this.showHitEffect(e.clientX, e.clientY, points);
                this.showTargetReaction();
                this.showBloodEffect(e.clientX, e.clientY);
                this.createBulletHole(e.clientX, e.clientY);
                this.screenShake();
            }
        }
        
        // 총기 효과 표시
        this.showWeaponEffect(e.clientX, e.clientY);
        
        // 명중하지 않았을 때 메시지
        if (!hit) {
            this.showMessage('빗나갔습니다!');
        }
        
        this.updateUI();
        
        // 게임 오버 체크
        if (this.ammo <= 0) {
            setTimeout(() => {
                this.gameOver();
            }, 1000);
        }
    }
    
    showHitEffect(x, y, points) {
        this.hitMarker.textContent = `+${points}`;
        this.hitMarker.style.left = `${x}px`;
        this.hitMarker.style.top = `${y}px`;
        this.hitMarker.classList.add('show');
        
        setTimeout(() => {
            this.hitMarker.classList.remove('show');
        }, 1000);
    }
    
    showWeaponEffect(x, y) {
        const weapon = this.weapons[this.currentWeapon];
        const effect = document.createElement('div');
        effect.className = `weapon-effect ${weapon.effect}`;
        effect.style.left = `${x}px`;
        effect.style.top = `${y}px`;
        
        this.gameArea.appendChild(effect);
        
        // 총기별 추가 효과
        if (this.currentWeapon === 'shotgun') {
            this.showShotgunBlast(x, y);
        } else if (this.currentWeapon === 'bazooka') {
            this.showBazookaExplosion(x, y);
        }
        
        setTimeout(() => {
            effect.remove();
        }, 500);
    }
    
    showShotgunBlast(x, y) {
        const blast = document.createElement('div');
        blast.className = 'shotgun-blast';
        blast.style.left = `${x - 30}px`;
        blast.style.top = `${y - 30}px`;
        
        this.gameArea.appendChild(blast);
        
        setTimeout(() => {
            blast.remove();
        }, 400);
    }
    
    showBazookaExplosion(x, y) {
        const explosion = document.createElement('div');
        explosion.className = 'bazooka-explosion';
        explosion.style.left = `${x - 50}px`;
        explosion.style.top = `${y - 50}px`;
        
        this.gameArea.appendChild(explosion);
        
        // 폭발 파티클 효과
        for (let i = 0; i < 8; i++) {
            const particle = document.createElement('div');
            particle.className = 'explosion-particle';
            particle.style.left = `${x + (Math.random() - 0.5) * 100}px`;
            particle.style.top = `${y + (Math.random() - 0.5) * 100}px`;
            
            this.gameArea.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 800);
        }
        
        setTimeout(() => {
            explosion.remove();
        }, 600);
    }
    
    showTargetReaction() {
        // 과녁 반응 애니메이션
        this.target.classList.add('hit');
        this.target.classList.add('bleeding');
        setTimeout(() => {
            this.target.classList.remove('hit');
            this.target.classList.remove('bleeding');
        }, 300);
        
        // 말풍선 표시
        const reactions = [
            '아야야야!',
            '으아아아!',
            '아파요!',
            '살려주세요!',
            '너무해요!',
            '그만 쏘세요!',
            '아이고!',
            '으으으!',
            '피가 나요!',
            '죽겠어요!',
            '너무 아파요!',
            '그만해요!',
            '고성현이 아파요!',
            '그만 때려요!',
            '살려주세요!',
            '너무해요!',
            '아 존나 아프네!',
            '살살해 진솔이형!',
            '그만 쏘라고!',
            '아파 죽겠어!',
            '진솔이형 살려줘!',
            '너무해 진솔이형!',
            '아이고 아파요!',
            '그만 때려 진솔이형!'
        ];
        
        const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
        this.speechBubble.querySelector('.bubble-text').textContent = randomReaction;
        
        // 말풍선을 과녁 위에 표시
        this.speechBubble.style.display = 'block';
        this.speechBubble.classList.add('show');
        
        setTimeout(() => {
            this.speechBubble.classList.remove('show');
            setTimeout(() => {
                this.speechBubble.style.display = 'none';
            }, 300);
        }, 2000);
    }
    
    showBloodEffect(x, y) {
        // 피 효과 생성
        for (let i = 0; i < 5; i++) {
            const bloodDrop = document.createElement('div');
            bloodDrop.className = 'blood-drop';
            bloodDrop.style.left = `${x + (Math.random() - 0.5) * 40}px`;
            bloodDrop.style.top = `${y + (Math.random() - 0.5) * 40}px`;
            
            this.gameArea.appendChild(bloodDrop);
            
            setTimeout(() => {
                bloodDrop.remove();
            }, 1000);
        }
    }
    
    createBulletHole(x, y) {
        const bulletHole = document.createElement('div');
        bulletHole.className = 'bullet-hole';
        bulletHole.style.left = `${x - 6}px`;
        bulletHole.style.top = `${y - 6}px`;
        
        this.gameArea.appendChild(bulletHole);
        
        // 총알 구멍은 영구적으로 남김
        setTimeout(() => {
            bulletHole.style.opacity = '0.3';
        }, 300);
    }
    
    screenShake() {
        this.gameArea.classList.add('screen-shake');
        setTimeout(() => {
            this.gameArea.classList.remove('screen-shake');
        }, 300);
    }
    
    selectWeapon(weapon) {
        this.currentWeapon = weapon;
        
        // 버튼 활성화 상태 변경
        document.querySelectorAll('.weapon-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-weapon="${weapon}"]`).classList.add('active');
        
        this.showMessage(`${this.getWeaponName(weapon)} 선택됨`);
    }
    
    getWeaponName(weapon) {
        const names = {
            pistol: '권총',
            shotgun: '샷건',
            ak: 'AK-47',
            sniper: '스나이퍼',
            bazooka: '바주카포'
        };
        return names[weapon];
    }
    
    reload() {
        this.ammo = 30;
        this.updateUI();
        this.showMessage('재장전 완료!');
    }
    
    restart() {
        this.score = 0;
        this.ammo = 30;
        this.currentWeapon = 'pistol';
        this.selectWeapon('pistol');
        this.updateUI();
        this.showMessage('게임 재시작!');
    }
    
    gameOver() {
        const finalScore = this.score;
        alert(`게임 오버!\n최종 점수: ${finalScore}점\n\n다시 시작하려면 '다시시작' 버튼을 클릭하세요!`);
    }
    
    showMessage(message) {
        // 간단한 메시지 표시 (실제로는 더 예쁜 UI로 구현 가능)
        console.log(message);
    }
    
    updateUI() {
        this.scoreElement.textContent = this.score;
        this.ammoElement.textContent = this.ammo;
    }
}

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    new TargetGame();
}); 