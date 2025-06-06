let conversationHistory = [];
let loadingTextInterval;
let currentTheme = 'light';
let currentTextSize = 'medium';

document.addEventListener('DOMContentLoaded', function() {
    const chatContainer = document.getElementById('chatContainer');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const loadingScreen = document.getElementById('loadingScreen');
    const mainApp = document.getElementById('mainApp');
    const loadingTextElement = document.getElementById('loadingText');
    
    // Settings related elements
    const settingsButton = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettings = document.getElementById('closeSettings');
    const themeToggle = document.getElementById('themeToggle');
    const textSizeBtns = document.querySelectorAll('.text-size-btn');

    // Loading texts sequence
    const loadingTexts = [
        "Cargando...",
        "Preparando tu consulta...",
        "Buscando información...",
        "Pensando en soluciones..."
    ];
    let currentLoadingTextIndex = 0;

    // Function to update loading text
    function updateLoadingText() {
        loadingTextElement.textContent = loadingTexts[currentLoadingTextIndex];
        currentLoadingTextIndex = (currentLoadingTextIndex + 1) % loadingTexts.length;
    }

    // Start loading screen animation and text changes
    updateLoadingText(); // Set initial text
    loadingTextInterval = setInterval(updateLoadingText, 1500); // Change text every 1.5 seconds

    // Simulate loading time (4 to 8 seconds)
    const minLoadTime = 4000; // 4 seconds
    const maxLoadTime = 8000; // 8 seconds
    const loadTime = Math.random() * (maxLoadTime - minLoadTime) + minLoadTime;

    setTimeout(() => {
        // Stop changing text
        clearInterval(loadingTextInterval);

        // Hide loading screen with fade out
        loadingScreen.classList.add('hidden');

        // Show main app content after fade out
        loadingScreen.addEventListener('transitionend', () => {
             mainApp.classList.remove('hidden');
             // Initialize chat content after the app is visible
             initializeChatContent();
             // Initialize settings
             setupSettings();
        }, { once: true });

    }, loadTime);

    // Function to initialize the chat content after loading
    function initializeChatContent() {
        // Add suggestions for query
        addSuggestions();
        // Add initial welcome message
        addMessage("¡Hola! Soy tu asistente médico virtual. Estoy aquí para brindarte información sobre temas de salud y sugerir remedios naturales que han funcionado para otras personas. ¿En qué puedo ayudarte hoy?", true);
    }

    // Agregar sugerencias de consulta
    function addSuggestions() {
        const suggestions = [
            "¿Cómo aliviar el dolor de espalda?",
            "Remedios para el insomnio",
            "Consejos para la presión alta",
            "Alimentos saludables para diabéticos"
        ];

        const welcomeContainer = document.createElement('div');
        welcomeContainer.className = 'welcome-container';

        const welcomeTitle = document.createElement('div');
        welcomeTitle.className = 'welcome-title';
        welcomeTitle.textContent = '¡Bienvenido a ConsultorMed AI!';

        const welcomeText = document.createElement('div');
        welcomeText.className = 'welcome-text';
        welcomeText.textContent = 'Estamos aquí para ayudarte con tus consultas de salud. Puedes preguntarme sobre:';

        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'suggestions';

        suggestions.forEach(suggestion => {
            const chip = document.createElement('div');
            chip.className = 'suggestion-chip';
            chip.textContent = suggestion;
            chip.addEventListener('click', () => {
                userInput.value = suggestion;
                sendMessage();
            });
            suggestionsDiv.appendChild(chip);
        });

        welcomeContainer.appendChild(welcomeTitle);
        welcomeContainer.appendChild(welcomeText);
        welcomeContainer.appendChild(suggestionsDiv);
        chatContainer.appendChild(welcomeContainer);
    }

    // Función para añadir mensajes al chat
    function addMessage(message, isAI = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isAI ? 'ai-message' : 'user-message'}`;
        messageDiv.textContent = message;

        // Añadir animación de entrada suave
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';

        chatContainer.appendChild(messageDiv);

        // Forzar el reflow
        messageDiv.offsetHeight;

        messageDiv.style.transition = 'all 0.3s ease-out';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateY(0)';

        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Mostrar indicador de escritura
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.id = 'typingIndicator';
        indicator.textContent = 'ConsultorMed está escribiendo...';
        chatContainer.appendChild(indicator);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // Ocultar indicador de escritura
    function hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // Función para enviar mensaje
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // Añadir mensaje del usuario
        addMessage(message, false);
        userInput.value = '';

        // Añadir a la historia de la conversación
        conversationHistory.push({
            role: "user",
            content: message
        });

        // Mostrar indicador de escritura
        showTypingIndicator();

        try {
            const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer sk-6a1dbca0ef8a4f7380810036fc621aa8'
                },
                body: JSON.stringify({
                    model: "deepseek-chat",
                    messages: [
                        {
                            role: "system",
                            content: "Eres un consultor médico experto. Da respuestas breves y precauciones. Nunca uses asteriscos. Usa viñetas o números para listas. Nunca des instrucciones directas - en su lugar, menciona lo que la gente suele hacer o lo que ha funcionado para otros ('Algunas personas suelen...', 'Tradicionalmente se ha usado...'). Si detectas algo grave, sugiere consultar a un médico inmediatamente. Máximo 2-3 oraciones por respuesta. Siempre termina con 'Consulte a un profesional de salud para un diagnóstico preciso'."
                        },
                        ...conversationHistory
                    ],
                    max_tokens: 100,
                    temperature: 0.7
                })
            });

            const data = await response.json();

            // Ocultar indicador de escritura
            hideTypingIndicator();

            if (data.choices && data.choices[0]) {
                // Añadir respuesta de la IA
                const aiResponse = data.choices[0].message.content;
                addMessage(aiResponse, true);

                // Añadir a la historia de la conversación
                conversationHistory.push({
                    role: "assistant",
                    content: aiResponse
                });

                // Mantener solo las últimas 10 mensajes
                if (conversationHistory.length > 10) {
                    conversationHistory = conversationHistory.slice(-10);
                }
            } else {
                throw new Error('Respuesta inválida del API');
            }

        } catch (error) {
            hideTypingIndicator();
            addMessage("Lo siento, ha ocurrido un error. Por favor, intenta de nuevo.", true);
            console.error('Error:', error);
        }
    }

    // Event listeners for send button and input field
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Settings functionality
    function setupSettings() {
        // Open settings modal
        settingsButton.addEventListener('click', function() {
            settingsModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
        });
        
        // Close settings with X button
        closeSettings.addEventListener('click', function() {
            settingsModal.classList.add('hidden');
            document.body.style.overflow = '';
        });
        
        // Close settings when clicking outside the modal
        settingsModal.addEventListener('click', function(e) {
            if (e.target === settingsModal) {
                settingsModal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
        
        // Theme toggle functionality
        themeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-theme');
                currentTheme = 'dark';
            } else {
                document.body.classList.remove('dark-theme');
                currentTheme = 'light';
            }
            
            // Save preference to localStorage
            localStorage.setItem('theme', currentTheme);
        });
        
        // Text size functionality
        textSizeBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove active class from all buttons
                textSizeBtns.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                this.classList.add('active');
                
                // Get the selected size
                const size = this.getAttribute('data-size');
                currentTextSize = size;
                
                // Remove all text size classes from body
                document.body.classList.remove('text-small', 'text-medium', 'text-large');
                
                // Add the selected text size class
                document.body.classList.add('text-' + size);
                
                // Save preference to localStorage
                localStorage.setItem('textSize', size);
            });
        });
        
        // Load saved preferences
        loadSavedPreferences();
    }
    
    // Load saved user preferences
    function loadSavedPreferences() {
        // Load theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            currentTheme = savedTheme;
            if (savedTheme === 'dark') {
                document.body.classList.add('dark-theme');
                themeToggle.checked = true;
            }
        }
        
        // Load text size preference
        const savedTextSize = localStorage.getItem('textSize');
        if (savedTextSize) {
            currentTextSize = savedTextSize;
            document.body.classList.add('text-' + savedTextSize);
            
            // Update active button
            textSizeBtns.forEach(btn => {
                if (btn.getAttribute('data-size') === savedTextSize) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        } else {
            // Default to medium if not set
            document.body.classList.add('text-medium');
        }
    }
});
