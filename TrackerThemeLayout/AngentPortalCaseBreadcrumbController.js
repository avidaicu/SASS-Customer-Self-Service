({  
     
	getCaseNumberId : function(component, event, helper) {
        
        var params = {
            "caseId": component.get("v.recordId")
        }
        
        var caseNumber = helper.serverAction(component, "getCaseNumber", params);
        
        Promise.all([caseNumber]).then(function (results) {    
            const caseNumberResults = results[0];

            if (caseNumberResults && caseNumberResults.CaseNumber) {
                // Assign to attribute for use in view
                component.set('v.caseNumber', caseNumberResults.CaseNumber);
                console.log('caseNumberResults', caseNumberResults);
            }            
            
        })
        
	}
})