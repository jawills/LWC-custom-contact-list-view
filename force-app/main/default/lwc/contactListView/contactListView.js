import { LightningElement, wire } from 'lwc';

import getContacts from "@salesforce/apex/contactListViewHelper.getContacts"
import searchContact from "@salesforce/apex/contactListViewHelper.searchContact"
import deleteContacts from "@salesforce/apex/contactListViewHelper.deleteContacts"

import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';

const ACTIONS = [{label: 'Delete', name: 'delete'}]

const COLS = [{label: 'Name', fieldName: 'link', type: 'url', typeAttributes: {label: {fieldName: 'FullName'}}},
            {label: 'Email', fieldName: 'Email'},
            {label: 'Account', fieldName: "accountLink", type: 'url', typeAttributes: {label: {fieldName: 'AccountName'}}},
            {label: "Mailing Address", fieldName: 'MailingAddress'},
            { fieldName: "actions", type: 'action', typeAttributes: {rowActions: ACTIONS}}
]

export default class ContactListView extends NavigationMixin(LightningElement) {
    cols = COLS;
    contacts;
    wiredContacts;
    selectedContacts;
    baseData;

    get selectedContactsLen() {
        if(this.selectedContacts == undefined) return 0;
        return this.selectedContacts.length
    }

    @wire(getContacts)
    contactsWire(result){
        this.wiredContacts = result;
        if(result.data){
            this.contacts = result.data.map((row) => {
                return this.mapContacts(row);
            })
            this.baseData = this.contacts;
        }
        if(result.error){
            console.error(result.error);
        }
    }

    mapContacts(row){
        var accountName = '';
        var accountLink = '';
        if(row.AccountId != undefined){
            accountLink = `/${row.AccountId}`;
            accountName = row.Account['Name'];
        }

        var street = row.MailingStreet
        if(row.MailingStreet == undefined){
            street = ''
        }
        var city = row.MailingCity
        if(row.MailingCity == undefined){
            city = ''
        }
        var state = row.MailingState 
        if(row.MailingState == undefined){
            state = ''
        }
        var country = row.MailingCountry 
        if(row.MailingCountry == undefined){
            country = ''
        }
        var zipCode = row.MailingPostalCode
        if(row.MailingPostalCode == undefined){
            zipCode = ''
        }

        return {...row,
            FullName: `${row.FirstName} ${row.LastName}`,
            link: `/${row.Id}`,
            accountLink: accountLink,
            AccountName: accountName,
            MailingAddress: `${street} ${city} ${state} ${zipCode} ${country}`
        };
    }

    handleRowSelection(event){
        this.selectedContacts = event.detail.selectedRows;
    }

    async handleSearch(event){
        if(event.target.value == ""){
            this.contacts = this.baseData
        }else if(event.target.value.length > 1){
            const searchContacts = await searchContact({searchString: event.target.value})

            this.contacts = searchContacts.map(row => {
                return this.mapContacts(row);
            })
        }
    }

    navigateToNewRecordPage() {

        this[NavigationMixin.Navigate]({
            type: 'standard__objectPage',
            attributes: {
                objectApiName: 'Contact',
                actionName: 'new'
            }
        });
    }

    handleRowAction(event) {
        deleteContacts({contactIds : [event.detail.row.Id]}).then(() => {
            refreshApex(this.wiredContacts);
        })
    }

    deleteSelectedContacts(){
        const idList = this.selectedContacts.map( row => { return row.Id })
        deleteContacts({contactIds : idList}).then( () => {
            refreshApex(this.wiredContacts);
        })
        this.template.querySelector('lightning-datatable').selectedRows = [];
        this.selectedContacts = undefined;
    }
}