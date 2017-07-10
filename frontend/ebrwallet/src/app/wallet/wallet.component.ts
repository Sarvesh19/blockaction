import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { WalletService } from '../services/wallet.service'
import { AuthService } from '../services/auth.service'
import { TransactionService } from '../services/transaction.service'

import { Wallet } from '../wallet'


declare var toastr: any;
declare var ga : any;

toastr.options = {
  "closeButton": true,
  "debug": false,
  "newestOnTop": true,
  "progressBar": false,
  "positionClass": "toast-top-right",
  "preventDuplicates": false,
  "onclick": null,
  "showDuration": "300",
  "hideDuration": "1000",
  "timeOut": "5000",
  "extendedTimeOut": "1000",
  "showEasing": "swing",
  "hideEasing": "linear",
  "showMethod": "fadeIn",
  "hideMethod": "fadeOut"
}

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html'
})

export class WalletComponent implements OnInit {

  // file : any
  // filePassword: string
  // privateKey: string
  walletForm : FormGroup; 
  requestEtherForm : FormGroup;

  wallet     : Wallet  // Wallet object
  qrSvg      : string  // QrCode SVG string
  ethusd     : any

  disabled        : boolean = false // disable "create wallet" button
  slideClass      : string  = ''
  passphraseType  : string  = 'password'
  passphraseButton: string  = 'Show Passphrase'
  qrClass         : string  = ''
  modalVisible    : boolean = false

  identicon       : any
  ready           : boolean = false

  constructor(@Inject(FormBuilder) fb: FormBuilder, private walletService: WalletService, private authService: AuthService, private transactionService: TransactionService) {
    var passwordValidator = Validators.compose([
                              Validators.required,
                              Validators.maxLength(20),
                              Validators.pattern(/^.*(?=.{8,20})(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@#$%^&+=])[a-zA-Z0-9@#$%^&+=]*$/)
                            ]);

    this.walletForm = fb.group({
      password: ['', [ passwordValidator ]],
    }
    )

    this.requestEtherForm = fb.group({
      email: ['', Validators.email],
      amount_ether: ['0'],
      amount_usd: ['0'],
      comment : ['']
    })
  }

  passwordCheck(password: string) {
    let passwordLength = false;
    let passwordLowercase = false;
    let passwordUppercase = false;
    let passwordNumber = false;    
    let passwordSpecialchar = false;    
    
    if(/^.*(?=.{8,20})[a-zA-Z0-9@#$%^&+=]*$/.test(password)) {
      passwordLength = true;
    }
    if(/^.*(?=.*[a-z])[a-zA-Z0-9@#$%^&+=]*$/.test(password)){
      passwordLowercase = true;
    }
    
    if(/^.*(?=.*[A-Z])[a-zA-Z0-9@#$%^&+=]*$/.test(password)){
      passwordUppercase = true;
    }

    if(/^.*(?=.*[0-9])[a-zA-Z0-9@#$%^&+=]*$/.test(password)){
      passwordNumber = true;
    }

    if(/^.*(?=.*[@#$%^&+=])[a-zA-Z0-9@#$%^&+=]*$/.test(password)){
      passwordSpecialchar = true;
    }

    return {
      passwordLength,
      passwordLowercase,
      passwordUppercase,
      passwordNumber,
      passwordSpecialchar,
      all : passwordLength && passwordLowercase && passwordUppercase && passwordNumber && passwordSpecialchar
    }
  }

  ngOnInit(): void {
    this.transactionService
      .getPrice()
      .then(res => {
        this.ethusd = {
          value: res.ethusd,
          time : new Date(res.ethusd_timestamp * 1000)
        }
      })
      .catch(err=> toastr.error('Couldn\'t get exchange rate'))
  }

  get isDisabled() {
    return this.disabled || !this.walletForm.valid
  }

  showQr(): void {
    if (this.wallet) {
      this.walletService
          .getQrCode(this.wallet)
          .then(qrCode => this.qrSvg = qrCode)
    }
  }
  
  isReady() {
    this.ready = true;
  }
  qrToggle() {
    this.qrClass === ''
      ? this.qrClass = 'showQr'
      : this.qrClass = ''
  }
  passphraseToggle() {
    this.passphraseType === 'password'
      ? this.passphraseType = 'text'
      : this.passphraseType = 'password'

    this.passphraseButton === 'Show Passphrase'
      ? this.passphraseButton = 'Hide Passphrase'
      : this.passphraseButton = 'Show Passphrase'
  }

  // Decrypt private key from wallet keystore file
  // getKey() : void {

  // this.walletService
  //   .getPrivateKeyString(this.wallet ,this.filePassword)
  //   .then(key => {
  //     this.privateKey= key;
  //     this.filePassword = null;
  //     toastr.success('Wallet decrypted', "Show Private Key")

  //   })
  //   .catch(err => {
  //     this.filePassword = null
  //     toastr.error('Incorrect Password', "Show Private Key")
  //   })
  // }



  create(): void {

     ga('send', 'event', {
      eventCategory: 'Wallet',
      eventLabel: 'Wallet Creation',
      eventAction: 'Button Clicked',
      eventValue: true
    });


    this.disabled = true

    setTimeout(function () {
      this.walletService
        .createWallet(this.walletForm.value.password)
        .then(data => {
          this.wallet = data
          this.walletForm.controls.password.setValue('')
          this.slideClass = 'slide'
          toastr.success('Created!', "Wallet Creation")
          this.showQr()
          this.identicon = this.walletService.getIdenticon(this.wallet);    
          // document.getElementById('iconImage').setAttribute('src','data:image/png;base64,'+ this.identicon)            
          
          this.disabled = false
        })
        .catch(err => {
          console.error(err)
          // toastr.error("An Error Occurred", "Wallet Creation")
          this.disabled = false
        })
    }.bind(this), 1000)

  }

  saveWalletToFile(): void {
    this.walletService
      .saveWalletToFile(this.wallet)
      .catch(err => toastr.error("An error occurred while downloading", "Wallet Download"))
  }


  /*  Loading wallet by file upload
   *
   *
  fileChangeListener($event) : void {
    this.readThis($event.target);
  }

  readThis(inputValue: any) : void {
    var self = this;
    var file:File = inputValue.files[0];
    var myReader:FileReader = new FileReader();

    myReader.onloadend = function(e){
      self.loadWalletFromString(myReader.result)
    }
    myReader.readAsText(file);
  }
  loadWalletFromString(s: string): void {
    try {
      this.wallet  = {
        keystore: JSON.parse(s),
        address : JSON.parse(s).address
      }
    }catch(e){
      toastr.error("Cannot read from wallet file.", "Load Wallet")
    }

    this.showQr();
  }
  */

  deleteWallet(): void {
    this.wallet = null;
    this.qrSvg = null
    // this.password = null
    // this.privateKey = null
    // this.file = null
    // this.filePassword = null
  }

  printPaperWallets(strJson) {
    this.walletService.getPaperWallet(this.wallet).then(data => {
      var win = window.open("about:blank", "rel='noopener'", "_blank");
      win.document.write(data.paperHTML)
      win.document.getElementById('privQrImage').setAttribute('src','data:image/svg+xml;base64,'+ window.btoa(data.privQrCodeData))
      win.document.getElementById('addrQrImage').setAttribute('src','data:image/svg+xml;base64,'+ window.btoa(data.addrQrCodeData))      
      win.document.getElementById('iconImage').setAttribute('src','data:image/png;base64,'+ data.identiconData)            
      setTimeout(function(){
        win.print()
      }, 3000)
  }).catch(err => toastr.error(err))
  }

  etherAmountChanged(e) {
    let ether_value = parseFloat(e.target.value)
    if(ether_value !== 0 && e.target.value.length > ether_value.toString().length ) {
      e.target.value = ether_value;
    }
    if(ether_value && !isNaN(ether_value)  &&  ether_value >  0){
      let amount_in_usd = ether_value * this.ethusd.value
      this.requestEtherForm.controls.amount_usd.setValue(amount_in_usd)
    }
  }

  usdAmountChanged(e) {
    let usd_value = parseFloat(e.target.value)
    if(usd_value !== 0 && e.target.value.length > usd_value.toString().length ) {
      e.target.value = usd_value;
    }
    if(usd_value && !isNaN(usd_value) &&  usd_value > 0){
      let amount_in_ether = usd_value / this.ethusd.value
      this.requestEtherForm.controls.amount_ether.setValue(amount_in_ether)
    }
  }

  requestEther() {
    this.modalVisible = false;

    if(!this.ethusd){
      this.transactionService
      .getPrice()
      .then(res => {
        this.ethusd = {
          value: res.ethusd,
          time : new Date(res.ethusd_timestamp * 1000)
        }
      })
      .catch(err=> toastr.error('Couldn\'t get exchange rate'))
    }
    
    let em = this.requestEtherForm.controls.email.value;
    let am = this.requestEtherForm.controls.amount_ether.value;
    let str = `Ether request sent to ${em} for ${am} ether.`
    toastr.success(str, 'Request Ether')
  }
  showModal() {
    this.modalVisible = true;
  }

  cancelModal() {
    this.modalVisible = false;
  }
}
