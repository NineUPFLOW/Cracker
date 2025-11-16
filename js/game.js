// Основной игровой движок
class NeuroNetGame {
    constructor() {
        this.gameData = null;
        this.telegramUser = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            // Инициализация Telegram Web App
            await this.initTelegram();
            
            // Загрузка игровых данных
            await this.loadGameData();
            
            // Инициализация интерфейса
            this.initUI();
            
            // Запуск игровых циклов
            this.startGameLoops();
            
            this.isInitialized = true;
            console.log('NeuroNet Game initialized successfully');
            
        } catch (error) {
            console.error('Game initialization failed:', error);
            this.showNotification('Ошибка инициализации игры');
        }
    }

    async initTelegram() {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.ready();
            this.telegramUser = Telegram.WebApp.initDataUnsafe?.user;
            
            // Настройка интерфейса Telegram
            Telegram.WebApp.setHeaderColor('#0c0e14');
            Telegram.WebApp.setBackgroundColor('#0c0e14');
            Telegram.WebApp.expand();
            
            if (this.telegramUser) {
                this.gameData.username = this.telegramUser.first_name || 
                                       this.telegramUser.username || 
                                       `HACKER_${Math.floor(Math.random() * 10000)}`;
            }
        }
    }

    async loadGameData() {
        const saved = localStorage.getItem('neuro_save');
        if (saved) {
            this.gameData = JSON.parse(saved);
            
            // Проверка на читерство
            if (this.gameData.lastPlayed > Date.now()) {
                this.showNotification('Обнаружена попытка изменения времени!');
                this.gameData = this.createNewGameData();
            }
            
            // Восстановление энергии
            this.restoreOfflineEnergy();
            
        } else {
            this.gameData = this.createNewGameData();
        }

        // Инициализация новых систем
        this.initQuests();
        this.initEvents();
        this.initDailyChallenges();
    }

    createNewGameData() {
        return {
            username: "HACKER_" + Math.floor(Math.random() * 1000),
            level: 1,
            experience: 0,
            credits: 0.00001000,
            reputation: 0,
            energy: 100,
            maxEnergy: 100,
            notoriety: 0,
            skillPoints: 5,
            lastPlayed: Date.now(),
            lastOnline: Date.now(),
            dailyRewardClaimed: false,
            totalPlayTime: 0,
            
            // Новые системы
            quests: {
                activeChain: 'beginner',
                progress: {},
                completed: []
            },
            
            dailyChallenges: {
                lastReset: Date.now(),
                completed: {},
                progress: {}
            },
            
            achievements: {
                // ... существующие достижения
            },
            
            // Существующие данные
            missions: {},
            upgrades: {
                processor: { level: 1, cost: 0.00050000, effect: 1, maxLevel: 10, name: "Процессор", desc: "Увеличивает скорость взлома" },
                // ... другие улучшения
            },
            inventory: {},
            minigames: {
                scanning: { level: 1, completed: 0, lastPlayed: 0, cooldown: 30000 },
                codebreaker: { level: 1, completed: 0, lastPlayed: 0, cooldown: 45000 },
                sequence: { level: 1, completed: 0, lastPlayed: 0, cooldown: 60000 }
            },
            mining: {
                miners: 0,
                minerLevel: 1,
                offlineEarned: 0
            }
        };
    }

    initUI() {
        this.setupEventListeners();
        this.updateUI();
        this.loadMissions();
        this.loadShop('tools');
        this.loadUpgrades();
        this.loadInventory();
        this.loadAchievements();
        this.initMap();
        
        // Скрыть экран загрузки
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('game-container').style.opacity = '1';
    }

    startGameLoops() {
        // Автосохранение каждые 30 секунд
        setInterval(() => this.saveGame(), 30000);
        
        // Восстановление энергии каждую минуту
        setInterval(() => this.restoreEnergy(), 60000);
        
        // Обновление UI каждые 100ms
        setInterval(() => this.updateCooldowns(), 100);
        
        // Проверка событий каждые 5 минут
        setInterval(() => this.checkEvents(), 300000);
        
        // Обновление времени игры
        setInterval(() => this.updatePlayTime(), 1000);
    }

    updatePlayTime() {
        this.gameData.totalPlayTime++;
        // Разблокировка достижений за время игры
        if (this.gameData.totalPlayTime === 3600) { // 1 час
            this.unlockAchievement('veteran_hacker');
        }
    }

    // Новые функции быстрых действий
    quickAction(action) {
        switch(action) {
            case 'energy':
                if (this.gameData.inventory.energyDrink > 0) {
                    this.useEnergyItem('energyDrink');
                } else {
                    this.showNotification('Нет энергетиков в инвентаре');
                    this.switchTab('shop');
                }
                break;
                
            case 'missions':
                this.switchTab('missions');
                break;
                
            case 'hack':
                this.switchTab('minigames');
                break;
                
            case 'shop':
                this.switchTab('shop');
                break;
                
            case 'mining':
                this.showNotification(`Майнеров: ${this.gameData.mining.miners}\nДоход: ${this.formatCrypto(this.calculateMiningIncome())}₿/час`);
                break;
        }
    }

    // Улучшенная система уведомлений
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const text = document.getElementById('notification-text');
        
        text.textContent = message;
        
        // Разные цвета для разных типов уведомлений
        const colors = {
            info: 'var(--neon-blue)',
            success: 'var(--neon-green)',
            warning: 'var(--neon-yellow)',
            error: 'var(--neon-red)'
        };
        
        notification.style.borderLeftColor = colors[type];
        notification.style.display = 'block';
        
        // Вибрация для мобильных устройств
        if (navigator.vibrate) {
            navigator.vibrate(200);
        }
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    // Оптимизированное сохранение
    saveGame() {
        this.gameData.lastPlayed = Date.now();
        
        // Сжатие данных перед сохранением
        const compressedData = this.compressGameData(this.gameData);
        localStorage.setItem('neuro_save', JSON.stringify(compressedData));
        
        // Синхронизация с облаком (если есть подключение)
        if (navigator.onLine) {
            this.syncWithCloud();
        }
    }

    compressGameData(data) {
        // Простое сжатие данных
        return {
            // Только существенные данные
            v: 2, // версия данных
            u: data.username,
            l: data.level,
            xp: data.experience,
            c: data.credits,
            r: data.reputation,
            e: data.energy,
            me: data.maxEnergy,
            n: data.notoriety,
            sp: data.skillPoints,
            lp: data.lastPlayed,
            // ... остальные важные данные
        };
    }

    async syncWithCloud() {
        // Интеграция с облачным сохранением через Telegram
        if (window.Telegram && Telegram.WebApp) {
            try {
                // Здесь можно добавить синхронизацию с облаком
                console.log('Cloud sync completed');
            } catch (error) {
                console.warn('Cloud sync failed:', error);
            }
        }
    }

    // Добавление новых методов для улучшенного геймплея
    startTutorial() {
        if (!this.gameData.tutorialCompleted) {
            this.showNotification('Добро пожаловать в NeuroNet! Начните с простой миссии.', 'info');
            // Запуск интерактивного обучения
        }
    }

    // Методы для работы с Telegram
    shareGame() {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.shareUrl(
                window.location.href,
                `Присоединяйся к NeuroNet! Я уже на ${this.gameData.level} уровне!`
            );
        } else {
            this.showNotification('Поделитесь ссылкой с друзьями!', 'info');
        }
    }

    // Остальные существующие методы...
    // ... (все существующие функции из оригинального кода)
}

// Инициализация игры
const game = new NeuroNetGame();

// Запуск игры когда страница загружена
window.addEventListener('DOMContentLoaded', () => {
    game.init();
});

// Обработка онлайн/офлайн статуса
window.addEventListener('online', () => {
    game.showNotification('Соединение восстановлено', 'success');
    game.syncWithCloud();
});

window.addEventListener('offline', () => {
    game.showNotification('Потеряно соединение. Работа в офлайн режиме.', 'warning');
});
