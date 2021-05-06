({
    onInit : function(component, event, helper) {
        
        if (SGAgentPortalGlobals.maintenance) {
            window.location = 'maintenance';
            return;
        }
        
        var guestId = '005D0000008Sa5aIAC';
        
        var portalPath = '';
        
        if (window.location.pathname.indexOf('/partnerCommunity/') !== -1) {
            portalPath = '/partnerCommunity/s/';
        } else if (window.location.pathname.indexOf('/agentCommunity/') !== -1) {
            portalPath = '/agentCommunity/s/';
        } else {
            portalPath = '/s/';
        }
        
        component.set('v.portalPath', portalPath);
        
        var userInfo = helper.serverAction(component, 'getUserinfo');
        
        // Assign interaction ready for use
        helper.assignGAInteraction();
        
        // Resolve an array of promises
        Promise.all([userInfo]).then(function(results) {
            
            var userInfo = results[0][0];
            var language;
            
            if (userInfo.Id !== guestId) {
                language = userInfo.Language__c;
                component.set('v.user', userInfo);
            } else {
                language = $A.get("$Locale.language")
            }
            
            var persistedGuestLanguage = localStorage.getItem('sgap-locale');
            
            component.set('v.userLocale', helper.mapLocaleToDataAPI(language));
            component.set('v.uid', userInfo.Id);  
            component.set('v.isLoggedIn', (userInfo.Id !== guestId) ? true : false);
            //console.log('is logged in '+(userInfo.Id !== guestId));
            component.set('v.hasUserData', true);
            
            // Assign locale to our shared globals that the other components can use
            SGAgentPortalGlobals.agent =  SGAgentPortalGlobals.agent || {};
            SGAgentPortalGlobals.agent.locale = component.get('v.userLocale');
            SGAgentPortalGlobals.agent.isLoggedIn = (userInfo.Id !== guestId) ? true : false;
            SGAgentPortalGlobals.agent.preferredNews = userInfo.Preferred_news_categories__c || null;
            
            var config = {
                locale: component.get('v.userLocale')
            }
            
            /** Fetch configuration for portal **/
            var agentConfig = helper.serverAction(component, 'getPortalConfig', config);
            
            Promise.all([agentConfig]).then(function(config) {
                
                SGAgentPortalGlobals.config = JSON.parse(config) || {};
                SGAgentPortalGlobals.isReady = true;
                
                var languages = SGAgentPortalGlobals.config.languages.map(function(language){
                    language.selectorLanguageValue =  (language.salesforceLanguageCode == 'en_GB') ? 'English' : 'Chinese'
                    
                    if (SGAgentPortalGlobals.agent.locale == language.sitecoreLanguage) {
                        component.set('v.selectedLanguage', language.languageSelectorText)
                    }
                    
                    return language;
                });
                
                component.set('v.languages', languages);
                
                var templateText = {
                    changeLanguage: SGAgentPortalGlobals.config.portalText.changeLanguage
                }
                
                component.set('v.templateText', templateText);
                
            }).catch(function (err) {
                //Handle errors on any promise here
                //console.log(err);
                
                component.find('overlayLib').showCustomModal({
                    body: 'We encountered an issue getting content for this page. The page may not display or work as expected. Please refresh the page.',
                    showCloseButton: true,
                    cssClass: "error-modal",
                })
            });
            
            
        }).catch(function (err) {
            //Handle errors on any promise here
            //console.log(err);
            
        });
        
    },
    handleAnalyticsEvent: function(component, event, helper) {
        
        // Look for single instance
        var category = event.getParam('category');
        var action = event.getParam('action');
        var label = event.getParam('label');
        
        // An array of the above
        var queue = event.getParam('queue') || [];
        
        /** Check if we're dealing with a queue of events **/
        if (queue.length > 0) {
            
            for (var i = 0; i< queue.length; i++) {
                
                var eventTrackingObj = {
                    hitType: 'event' // Currently the only supported event
                };
                
                if (typeof queue[i].category !== 'undefined' && typeof queue[i].category !== null) {
                    eventTrackingObj.eventCategory = queue[i].category;
                }
                
                // Add eventAction if we've been supplied an action
                if (typeof queue[i].action !== 'undefined' && typeof queue[i].action !== null) {
                    eventTrackingObj.eventAction = queue[i].action;
                }
                
                // Add eventLabel if we've been supplied a label
                if (typeof queue[i].label !== 'undefined' && typeof queue[i].label !== null) {
                    eventTrackingObj.eventLabel = queue[i].label;
                }
                
                helper.addToAnalyticsQueue(eventTrackingObj);
            }
            
        } else {
            
            var eventTrackingObj = {
                hitType: 'event' // Currently the only supported event
            };
            
            // Add eventCategory if we've been supplied a category
            if (typeof category !== 'undefined' && typeof category !== null) {
                eventTrackingObj.eventCategory = category;
            }
            
            // Add eventAction if we've been supplied an action
            if (typeof action !== 'undefined' && typeof action !== null) {
                eventTrackingObj.eventAction = action;
            }
            
            // Add eventLabel if we've been supplied a label
            if (typeof label !== 'undefined' && typeof label !== null) {
                eventTrackingObj.eventLabel = label;
            }
            
            helper.addToAnalyticsQueue(eventTrackingObj);
        }
        
        helper.sendInteraction();
        
    },
    onGAInteraction: function(component, event, helper) {     
        helper.assignGAInteraction();
        
        // Remove the sent event from the queue
        //console.log('removing sent item from the array')
        helper.analyticsQueue.shift();
        
        // Check for additional queued events and send
        if (helper.analyticsQueue.length >= 1) {
            //console.log('items still exist, sending event')
            helper.sendInteraction();  
        }
    },
    changeLanguage: function(component, event, helper) {
        var selectedLanguage = event.getParam("value");
        //console.log('Change language to '+selectedLanguage)
        //console.log(component.get('v.isLoggedIn'));
        
        if (component.get('v.isLoggedIn')) {
            var langParams = {
                preferredLang: selectedLanguage
            }
            
            switch(selectedLanguage) {
                case 'English':
                    localStorage.setItem('sgap-locale', 'en_GB');
                    break;
                case 'Chinese':
                    localStorage.setItem('sgap-locale', 'zh_CN');
                    break;
            }
            
            var languagePreference = helper.serverAction(component, 'setPreferredLanguage', langParams);
            
            Promise.all([languagePreference]).then(function(lang) {
                // console.log('lang changed');
                window.location.reload(); 
            }).catch(function (err) {
                // console.log('error changing language');
            })
            
        } else {
            
            var lang = '';
            
            switch(selectedLanguage) {
                case 'English':
                    lang = 'en_GB';
                    break;
                case 'Chinese':
                    lang = 'zh_CN';
                    break;
            }
            
            localStorage.setItem('sgap-locale', lang);
            window.location.search = '?language=' + lang;
        }
        
    },
    
    onViewRefresh : function(component, event, helper) {
        
        // Limit to profile page
        if (window.location.href.indexOf('/s/profile/') !== -1) {
            // Force reload the page as the language has likely changed
            window.location.reload();
        }    	
    }
})