({
    supportedLocales: ['en_US', 'zh_CN'],
    analyticsInteraction: null,
    analyticsQueue: [],
	stickyNavigation : function() {
        //console.log('sticky navigation')
        var navBar = null, profileContainer = null, navStickyOffset, stickyElements;
        
        var assignStickyElements = function() {
            //console.log('assignStickyElements')
            // Navigation bar
            navBar = document.querySelector('.sgap-navigation');
            profileContainer  = document.querySelector('.profileMenuRegion');
            
            // Navigation offset
            try {
                navStickyOffset = navBar.offsetTop;
            } catch (e) {
                
            }
            
            stickyElements = [navBar, profileContainer];
        };
        
        //window.onscroll = () => {
       	window.onscroll = function() {
            if (navBar === null || profileContainer === null) {
                assignStickyElements();
                return;
            }
            
                     
            // Update if the offset changes
            if (navBar.className.indexOf('sticky') == -1 && navStickyOffset !== navBar.offsetTop) {
                navStickyOffset = navBar.offsetTop;
            }
            
            if (window.pageYOffset >= navStickyOffset) {
                stickyElements.forEach(function(item, index) {
                    item.classList.add('sticky');
                });
            } else {
                 stickyElements.forEach(function(item, index) {
                    item.classList.remove('sticky');
                });
            }
            
        };
	},
    /**
     * Generic function to call APEX server side actions
     **/
    serverAction : function(component, method, params) {
        var self = this;
            return new Promise(function(resolve, reject) {
                var action = component.get('c.' + method);
    
                if(params != null)
                    action.setParams(params);
                	action.setStorable();
                	action.setCallback(self, function(response){
                    
                    var state = response.getState();
    
                    if(state == 'SUCCESS')
                        resolve.call(this, response.getReturnValue());
                    else if(state == 'ERROR')
                        reject.call(this, response.getError());
                });
    
            $A.enqueueAction(action);
        });
    }, 
    /**
     * Takes a user locale and maps the value to that used by the data API
     * if the supplied locale is not a supported locale it will default to EN
     */
    mapLocaleToDataAPI: function(locale) {
        switch(locale) {
            case 'English':
                return 'en';
            case 'en':
                return 'en';
            case 'Chinese':
                return 'zh-CN';
           	case 'zh':
                return 'zh-CN';
            default:
                return 'en';
        }
    },
    mapLocaleToPersistedLocale: function(locale) {
        switch(locale) {
            case 'English':
                return 'en_GB';
            case 'en':
                return 'en_GB';
            case 'Chinese':
                return 'zh_CN';
           	case 'zh':
                return 'zh_CN';
            default:
                return 'en_GB';
        }
    },
    assignGAInteraction: function() {
        var analyticsInteraction = $A.get("e.forceCommunity:analyticsInteraction");
        //console.log('Assigning analytics interaction')
        if (typeof analyticsInteraction !== 'undefined') {
        	this.analyticsInteraction = analyticsInteraction;
        }
    },
    addToAnalyticsQueue: function(interaction) {
        //console.log('adding item to queue')
        this.analyticsQueue.push(interaction);
    },
    getAnalyticsQueue: function() {
    	return this.analyticsQueue   
    }, 
    sendInteraction: function() {
        //console.log('send interaction')
        // Is analyticsInteraction available with a fire methods
        if (typeof this.analyticsInteraction.setParams === 'function' && typeof this.analyticsInteraction.fire === 'function') {
            this.analyticsInteraction.setParams(this.analyticsQueue[0]);
            this.analyticsInteraction.fire();
        }
    },
    autoChangeLanguage: function(component, persistedLanguage, isLoggedIn) {
        
        var language = '';
        
        switch(persistedLanguage) {
            case 'en_GB':
            	language = 'English';
                break;
           case 'zh_CN':
            	language = 'Chinese';
                break;
        }
        
        //console.log('Change language to '+ language);
        
        if (isLoggedIn) {
            localStorage.setItem('locale', persistedLanguage);
            window.location.search = '?language=' + persistedLanguage;
        } else {
            var langParams = {
                preferredLang: language
            }
            var languagePreference = this.serverAction(component, 'setPreferredLanguage', langParams);
        	window.location.reload();   
        }
    }
})