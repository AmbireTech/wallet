(this["webpackJsonpambire-wallet"]=this["webpackJsonpambire-wallet"]||[]).push([[18],{1553:function(e,t,n){var r=n(2),s=n(185),a=n(55).ethers,i=["function isValidSignature(bytes32 hash, bytes signature) view returns (bytes4)"],c=function(){var e=s(r.mark((function e(t){var n,s,i,c,l,g,p;return r.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(n=t.provider,s=t.signer,i=t.message,c=t.typedData,l=t.finalDigest,g=t.signature,p=t.undeployedCallback,!i){e.next=5;break}l=a.utils.hashMessage(i),e.next=13;break;case 5:if(!c){e.next=11;break}if(c.domain&&c.types&&c.message){e.next=8;break}throw Error("Missing one or more properties for typedData (domain, types, message)");case 8:l=a.utils._TypedDataEncoder.hash(c.domain,c.types,c.message),e.next=13;break;case 11:if(l){e.next=13;break}throw Error("Missing one of the properties: message, unPrefixedMessage, typedData or finalDigest");case 13:if(!u(o(l,g),s)){e.next=15;break}return e.abrupt("return",!0);case 15:return e.next=17,d(n,s,l,g);case 17:if(e.t0=e.sent,"0x1626ba7e"!==e.t0){e.next=20;break}return e.abrupt("return",!0);case 20:if(!p){e.next=29;break}if(e.prev=21,!p(s,l,g)){e.next=24;break}return e.abrupt("return",!0);case 24:e.next=29;break;case 26:throw e.prev=26,e.t1=e.catch(21),new Error("undeployedCallback error: "+e.t1.message);case 29:return e.abrupt("return",!1);case 30:case"end":return e.stop()}}),e,null,[[21,26]])})));return function(t){return e.apply(this,arguments)}}(),o=function(e,t){try{return a.utils.recoverAddress(e,t)}catch(n){return!1}},u=function(e,t){if(!1===e)return!1;if(!a.utils.isAddress(e))throw new Error("Invalid recovered address: "+e);return e.toLowerCase()===t.toLowerCase()},d=function(){var e=s(r.mark((function e(t,n,s,c){var o,u,d;return r.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return o=a.providers.Provider.isProvider(t)?t:new a.providers.Web3Provider(t),e.next=3,o.getCode(n);case 3:if(!(u=e.sent)||"0x"===u){e.next=7;break}return d=new a.Contract(n,i,o),e.abrupt("return",d.isValidSignature(s,c));case 7:return e.abrupt("return",!1);case 8:case"end":return e.stop()}}),e)})));return function(t,n,r,s){return e.apply(this,arguments)}}();e.exports={verifyMessage:c}},1554:function(e,t,n){},1640:function(e,t,n){"use strict";n.r(t),n.d(t,"default",(function(){return E}));var r=n(8),s=n(2),a=n.n(s),i=n(11),c=n(7),o=n(922),u=n(101),d=n(21),l=n(3),g=n(1553),p=n(151),f=n(68),b=n(47),h=n(237);function v(e){return Object(d.isHexString)(e)?Object(d.arrayify)(e):Object(d.toUtf8Bytes)(e)}var j=function(e){var t,n,r=e.fetch,s=e.account,j=e.everythingToSign,m=e.relayerURL,x=e.addToast,O=e.resolve,y=e.onConfirmationCodeRequired,w=e.onLastMessageSign,k=e.getHardwareWallet,S=Object(l.useState)(!1),N=Object(c.a)(S,2),E=N[0],M=N[1],P=Object(l.useState)(null),T=Object(c.a)(P,2),A=T[0],I=T[1],D=Object(l.useState)(null),C=Object(c.a)(D,2),L=C[0],q=C[1],R=Object(l.useState)(null),_=Object(c.a)(R,2),U=_[0],W=_[1],G=Object(l.useState)(null),H=Object(c.a)(G,2),J=H[0],V=H[1],F=Object(l.useMemo)((function(){return j[0]||{}}),[j]),Y=F.chainId,z=-1!==["eth_signTypedData_v4","eth_signTypedData"].indexOf(null===F||void 0===F?void 0:F.type);if(z){n=F.txn;try{n.startsWith("{")&&(n=JSON.parse(F.txn))}catch(ue){n=F.txn}if("object"===typeof n&&null!==n)try{var B,K,Q,X,Z,$,ee,te;if(null===(B=n)||void 0===B||null===(K=B.types)||void 0===K?void 0:K.EIP712Domain)null===($=n)||void 0===$||(null===(ee=$.types)||void 0===ee||delete ee.EIP712Domain);if(d._TypedDataEncoder.hash(null===(Q=n)||void 0===Q?void 0:Q.domain,n.types,null===(X=n)||void 0===X?void 0:X.message),null===(Z=n.domain)||void 0===Z?void 0:Z.chainId)Y=null===(te=n.domain)||void 0===te?void 0:te.chainId}catch(de){t=".txn has Invalid TypedData object. Should be {domain, types, message}"}else t=".txn should be a TypedData object"}var ne,re=(ne=Y)?b.b.find((function(e){return e.chainId===parseInt(ne.toString(),10)})):null,se=Object(l.useCallback)(Object(i.a)(a.a.mark((function e(){var t,n,i,c,u,l,g,b,v,j,m,x,O,y;return a.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(re){e.next=2;break}return e.abrupt("return");case 2:return i=new o.Bundle({network:null===re||void 0===re?void 0:re.id,identity:null===s||void 0===s?void 0:s.id,signer:null===s||void 0===s?void 0:s.signer}),e.next=5,Object(h.a)(null===re||void 0===re?void 0:re.id);case 5:c=e.sent,(null===s||void 0===s||null===(t=s.signer)||void 0===t?void 0:t.quickAccManager)?(j=p.a.quickAccTimelock,m=[j,null===s||void 0===s||null===(g=s.signer)||void 0===g?void 0:g.one,null===s||void 0===s||null===(b=s.signer)||void 0===b?void 0:b.two],x=new d.AbiCoder,l=Object(d.keccak256)(x.encode(["tuple(uint, address, address)"],[m])),u=null===(v=s.signer)||void 0===v?void 0:v.quickAccManager):u=null===(O=s.signer)||void 0===O?void 0:O.address,y={method:"eth_call",params:[{to:i.identity,data:"0xc066a5b1000000000000000000000000".concat(u.toLowerCase().substring(2))},"latest"],id:1,jsonrpc:"2.0"},Object(f.b)(r,null===c||void 0===c||null===(n=c.connection)||void 0===n?void 0:n.url,y).then((function(e){var t;e.result&&"0x"!==e.result?(I(!0),(null===s||void 0===s||null===(t=s.signer)||void 0===t?void 0:t.quickAccManager)?q(e.result===l):"0x0000000000000000000000000000000000000000000000000000000000000001"===e.result?q(!0):q(!1)):I(!1)})).catch((function(e){W(e.message)}));case 9:case"end":return e.stop()}}),e)}))),[s,re,r]);Object(l.useEffect)((function(){se()}),[se]);var ae=Object(l.useCallback)((function(e){var t;e&&e.message.includes("must provide an Ethereum address")?x("Signing error: not connected with the correct address. Make sure you're connected with ".concat(null===(t=s.signer)||void 0===t?void 0:t.address,"."),{error:!0}):x("Signing error: ".concat(e.message||e),{error:!0})}),[s,x]),ie=Object(l.useCallback)((function(e,t,r){var a=Object(h.a)(r);return Object(g.verifyMessage)({provider:a,signer:s.id,message:z?null:v(e.txn),typedData:z?n:null,signature:t}).then((function(t){t?x("".concat(e.type," SIGNATURE VALID")):x("".concat(e.type," SIGNATURE INVALID"),{error:!0})})).catch((function(t){x("".concat(e.type," SIGNATURE INVALID: ").concat(t.message),{error:!0})}))}),[s,x,n,z]),ce=Object(l.useCallback)(function(){var e=Object(i.a)(a.a.mark((function e(t){var i,c,d,l,g,p,b,h;return a.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(m){e.next=3;break}return x("Email/pass accounts not supported without a relayer connection",{error:!0}),e.abrupt("return");case 3:if(t.password){e.next=6;break}return x("Password required to unlock the account",{error:!0}),e.abrupt("return");case 6:return M(!0),e.prev=7,e.next=10,Object(f.b)(r,"".concat(m,"/second-key/").concat(s.id,"/ethereum/sign").concat(z?"?typedData=true":""),{toSign:F.txn,code:(null===(i=t.code)||void 0===i?void 0:i.length)?t.code:void 0});case 10:if(c=e.sent,d=c.signature,l=c.success,g=c.message,p=c.confCodeRequired,l){e.next=24;break}if(M(!1),g){e.next=19;break}throw new Error("Secondary key: no success but no error message");case 19:return g.includes("invalid confirmation code")&&x("Unable to sign: wrong confirmation code",{error:!0}),x("Second signature error: ".concat(g),{error:!0}),V(null),M(!1),e.abrupt("return");case 24:if(!p){e.next=31;break}if(V(p),!y){e.next=29;break}return e.next=29,y(p,ce);case 29:return M(!1),e.abrupt("return");case 31:if(s.primaryKeyBackup){e.next=33;break}throw new Error("No key backup found: you need to import the account from JSON or login again.");case 33:return e.next=35,u.Wallet.fromEncryptedJson(JSON.parse(s.primaryKeyBackup),t.password);case 35:return b=e.sent,e.next=38,z?Object(o.signMessage712)(b,s.id,s.signer,n.domain,n.types,n.message,d):Object(o.signMessage)(b,s.id,s.signer,v(F.txn),d);case 38:return h=e.sent,e.next=41,ie(F,h,null===re||void 0===re?void 0:re.id);case 41:O({success:!0,result:h}),x("Successfully signed!"),1===j.length&&w&&w(),e.next=49;break;case 46:e.prev=46,e.t0=e.catch(7),ae(e.t0);case 49:M(!1);case 50:case"end":return e.stop()}}),e,null,[[7,46]])})));return function(t){return e.apply(this,arguments)}}(),[s,x,n,j,r,ae,z,y,w,m,re,O,F,ie]),oe=Object(l.useCallback)(function(){var e=Object(i.a)(a.a.mark((function e(t,r){var i,c,u;return a.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(!(null===(i=s.signer)||void 0===i?void 0:i.quickAccManager)){e.next=4;break}return e.next=3,ce(t);case 3:return e.abrupt("return");case 4:return M(!0),e.prev=5,e.next=8,k(r);case 8:if(c=e.sent){e.next=11;break}return e.abrupt("return");case 11:return e.next=13,"eth_signTypedData_v4"===F.type||"eth_signTypedData"===F.type?Object(o.signMessage712)(c,s.id,s.signer,n.domain,n.types,n.message):Object(o.signMessage)(c,s.id,s.signer,v(F.txn));case 13:return u=e.sent,e.next=16,ie(F,u,null===re||void 0===re?void 0:re.id);case 16:O({success:!0,result:u}),x("Successfully signed!"),e.next=23;break;case 20:e.prev=20,e.t0=e.catch(5),ae(e.t0);case 23:M(!1);case 24:case"end":return e.stop()}}),e,null,[[5,20]])})));return function(t,n){return e.apply(this,arguments)}}(),[s,x,ce,n,k,ae,null===re||void 0===re?void 0:re.id,O,F,ie]);return{approve:oe,approveQuickAcc:ce,toSign:F,isLoading:E,hasPrivileges:L,hasProviderError:U,typeDataErr:t,isDeployed:A,dataV4:n,requestedNetwork:re,requestedChainId:Y,isTypedData:z,confirmationType:J}},m=j,x=["https://snapshot.org","https://guild.xyz","https://sudoswap.xyz","https://evm-sigtools.ambire.com","https://app.swappin.gifts"],O=(n(1554),n(37)),y=n(232),w=n(614),k=n(44),S=n(77),N=n(4);function E(e){var t,n=e.everythingToSign,s=e.resolve,o=e.account,u=e.connections,d=e.relayerURL,g=e.totalRequests,p=Object(k.a)().addToast,f=Object(l.useState)({codeRequired:!1,passphrase:""}),b=Object(c.a)(f,2),h=b[0],v=b[1],j=Object(l.useState)(null),E=Object(c.a)(j,2),P=E[0],T=E[1],A=Object(l.useRef)(null),I=function(){var e=Object(i.a)(a.a.mark((function e(t,n){var r;return a.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,new Promise((function(e){T((function(){return e}))}));case 2:if(r=e.sent){e.next=5;break}throw new Error("You must enter a confirmation code");case 5:return e.next=7,n({password:h.passphrase,code:r});case 7:return e.abrupt("return");case 8:case"end":return e.stop()}}),e)})));return function(t,n){return e.apply(this,arguments)}}(),D=m({fetch:fetch,account:o,everythingToSign:n,relayerURL:d,addToast:p,resolve:s,onConfirmationCodeRequired:I,getHardwareWallet:function(){return Object(w.a)({signer:o.signer,signerExtra:o.signerExtra,chainId:1})}}),C=D.approve,L=D.toSign,q=D.isLoading,R=D.hasPrivileges,_=D.hasProviderError,U=D.typeDataErr,W=D.isDeployed,G=D.dataV4,H=D.requestedNetwork,J=D.requestedChainId,V=D.isTypedData,F=D.confirmationType,Y=u.find((function(e){return e.uri===L.wcUri})),z=Y&&(null===Y||void 0===Y||null===(t=Y.session)||void 0===t?void 0:t.peerMeta)||null,B=z&&x.includes(z.url);if(Object(l.useEffect)((function(){F&&A.current.focus()}),[F]),!L||!o)return Object(N.jsx)(N.Fragment,{});if(!H)return Object(N.jsxs)("div",{id:"signMessage",children:[Object(N.jsxs)("h3",{className:"error",children:["Inexistant network for chainId : ",J]}),Object(N.jsx)(S.e,{className:"reject",onClick:function(){return s({message:"signature denied"})},children:"Reject"})]});if(U)return Object(N.jsxs)("div",{id:"signMessage",children:[Object(N.jsxs)("h3",{className:"error",children:["Invalid signing request: ",U]}),Object(N.jsx)(S.e,{className:"reject",onClick:function(){return s({message:"signature denied"})},children:"Reject"})]});return Object(N.jsxs)("div",{id:"signMessage",children:[Object(N.jsxs)("div",{id:"signingAccount",className:"panel",children:[Object(N.jsx)("div",{className:"title",children:"Signing with account"}),Object(N.jsxs)("div",{className:"content",children:[Object(N.jsxs)("div",{className:"signingAccount-account",children:[Object(N.jsx)("img",{className:"icon",src:y.create({seed:o.id}).toDataURL(),alt:"Account Icon"}),o.id]}),Object(N.jsxs)("div",{className:"signingAccount-network",children:["on",Object(N.jsx)("div",{className:"icon",style:{backgroundImage:"url(".concat(H.icon,")")}}),Object(N.jsx)("div",{className:"address",children:H.name})]})]})]}),Object(N.jsxs)("div",{className:"panel",children:[Object(N.jsxs)("div",{className:"title signMessageTitle",children:[Object(N.jsx)("span",{className:"signMessageTitle-title",children:"Sign message"}),Object(N.jsx)("span",{className:"signMessageTitle-signatureType",children:Object(N.jsxs)(S.y,{label:"".concat(V?"An EIP-712 typed data signature has been requested":"An ethSign ethereum signature type has been requested"),children:[Object(N.jsx)(O.v,{})," ",Object(N.jsx)("span",{children:V?"EIP-712 type":"standard type"})]})})]}),Object(N.jsxs)("div",{className:"request-message",children:[Object(N.jsxs)("div",{className:"dapp-message",children:[z?Object(N.jsxs)("a",{className:"dapp",href:z.url,target:"_blank",rel:"noreferrer",children:[Object(N.jsx)("div",{className:"icon",style:{backgroundImage:"url(".concat(z.icons[0],")")},children:Object(N.jsx)(O.c,{})}),z.name]}):"A dApp ","is requesting your signature."]}),Object(N.jsx)("span",{children:g>1?"You have ".concat(g-1," more pending requests."):""}),!B&&Object(N.jsx)(S.i,{})]}),Object(N.jsx)("textarea",{className:"sign-message",type:"text",value:G?JSON.stringify(G,"\n"," "):"0x"!==L.txn?M(L.txn):"(Empty message)",readOnly:!0}),Object(N.jsx)("div",{className:"actions",children:Object(N.jsxs)("form",{onSubmit:function(e){e.preventDefault(),C({password:h.passphrase})},children:[o.signer.quickAccManager&&W&&Object(N.jsxs)(N.Fragment,{children:[Object(N.jsx)(S.w,{password:!0,required:!0,minLength:3,placeholder:"Account password",value:h.passphrase,onChange:function(e){return v(Object(r.a)(Object(r.a)({},h),{},{passphrase:e}))}}),Object(N.jsx)("input",{type:"submit",hidden:!0})]}),F&&Object(N.jsxs)(N.Fragment,{children:["email"===F&&Object(N.jsx)("span",{children:"A confirmation code has been sent to your email, it is valid for 3 minutes."}),"otp"===F&&Object(N.jsx)("span",{children:"Please enter your OTP code"}),Object(N.jsx)(S.w,{ref:A,placeholder:"otp"===F?"Authenticator OTP code":"Confirmation code",onInput:function(e){var t;6===(t=e).length&&P(t)}})]}),null===W&&!_&&Object(N.jsx)("div",{children:Object(N.jsx)(S.m,{})}),!1===W&&Object(N.jsxs)("div",{children:[Object(N.jsx)("h3",{className:"error",children:"You can't sign this message yet."}),Object(N.jsxs)("h3",{className:"error",children:["You need to complete your first transaction on"," ",H.name," network in order to be able to sign messages."]})]}),!1===R&&Object(N.jsx)("div",{children:Object(N.jsx)("h3",{className:"error",children:"You do not have the privileges to sign this message."})}),_&&Object(N.jsx)("div",{children:Object(N.jsxs)("h3",{className:"error",children:["There was an issue with the network provider:"," ",_]})}),Object(N.jsxs)("div",{className:"buttons",children:[Object(N.jsx)(S.e,{type:"button",danger:!0,icon:Object(N.jsx)(O.i,{}),className:"reject",onClick:function(){return s({message:"signature denied"})},children:"Reject"}),null!==W&&W&&R&&Object(N.jsx)(S.e,{type:"submit",className:"approve",disabled:q,children:q?Object(N.jsxs)(N.Fragment,{children:[Object(N.jsx)(S.m,{}),"Signing..."]}):Object(N.jsxs)(N.Fragment,{children:[Object(N.jsx)(O.g,{})," Sign"]})})]})]})})]})]})}function M(e){if(Object(d.isHexString)(e))try{return Object(d.toUtf8String)(e)}catch(t){return e}return(null===e||void 0===e?void 0:e.toString)?e.toString():e+""}},617:function(e,t,n){"use strict";n.d(t,"c",(function(){return p})),n.d(t,"a",(function(){return f})),n.d(t,"d",(function(){return b})),n.d(t,"b",(function(){return h})),n.d(t,"e",(function(){return v})),n.d(t,"f",(function(){return j})),n.d(t,"g",(function(){return m}));var r=n(8),s=n(2),a=n.n(s),i=n(11),c=n(633),o=n(55),u=n(619),d=n(609),l=2147483648,g={startPath:[2147483692,2147483708,l,0,0],n:10},p=function(e){var t={name:"Ambire Wallet",crypto:d,privKey:e};return new c.Client(t)},f=function(){var e=Object(i.a)(a.a.mark((function e(t,n){return a.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,new Promise((function(e,r){t.connect(n,(function(t,n){t?r("Lattice connect: ".concat(t," Or check if the DeviceID is correct.")):e({isPaired:!!n,errConnect:!1})}))})).catch((function(e){return console.error(e),{isPaired:!1,errConnect:e}}));case 2:return e.abrupt("return",e.sent);case 3:case"end":return e.stop()}}),e)})));return function(t,n){return e.apply(this,arguments)}}(),b=function(){var e=Object(i.a)(a.a.mark((function e(t,n){return a.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,new Promise((function(e,r){t.pair(n,(function(t,n){t?r("Lattice connect: ".concat(t)):e({hasActiveWallet:n,errPair:!1})}))})).catch((function(e){return console.error(e),{hasActiveWallet:!1,errPair:e}}));case 2:return e.abrupt("return",e.sent);case 3:case"end":return e.stop()}}),e)})));return function(t,n){return e.apply(this,arguments)}}(),h=function(){var e=Object(i.a)(a.a.mark((function e(t){return a.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,new Promise((function(e,n){t.getAddresses(g,(function(t,r){if(t)n("Lattice get addresses: ".concat(t));else{if(!r)throw new Error("Lattice could not get the addresses.");e({res:r,errGetAddresses:!1})}}))})).catch((function(e){return console.error(e),{res:null,errGetAddresses:e}}));case 2:return e.abrupt("return",e.sent);case 3:case"end":return e.stop()}}),e)})));return function(t){return e.apply(this,arguments)}}(),v=function(){var e=Object(i.a)(a.a.mark((function e(t,n){var r,s;return a.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return r={protocol:"signPersonal",payload:o.ethers.utils.hexlify(n),signerPath:[2147483692,2147483708,l,0,0]},s={currency:"ETH_MSG",data:r},e.next=4,new Promise((function(e,n){t.sign(s,(function(t,r){if(t)n(t);else{if(!r)throw new Error("Lattice could not sign the message.");e({signedMsg:"0x"+r.sig.r+r.sig.s+r.sig.v[0].toString(16),errSignMessage:!1})}}))})).catch((function(e){return console.error(e),{signedMsg:null,errSignMessage:e}}));case 4:return e.abrupt("return",e.sent);case 5:case"end":return e.stop()}}),e)})));return function(t,n){return e.apply(this,arguments)}}(),j=function(){var e=Object(i.a)(a.a.mark((function e(t,n){var r;return a.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return r={currency:"ETH_MSG",data:{signerPath:[2147483692,2147483708,l,0,0],protocol:"eip712",payload:n}},e.next=3,new Promise((function(e,n){t.sign(r,(function(t,r){if(t)n(t);else{if(!r)throw new Error("Lattice could not sign the message.");e({signedMsg:"0x"+r.sig.r+r.sig.s+r.sig.v[0].toString(16),errSignMessage:!1})}}))})).catch((function(e){return console.error(e),{signedMsg:null,errSignMessage:e}}));case 3:return e.abrupt("return",e.sent);case 4:case"end":return e.stop()}}),e)})));return function(t,n){return e.apply(this,arguments)}}(),m=function(){var e=Object(i.a)(a.a.mark((function e(t,n,s){var i,c,o,d,g,p,f,b,h,v;return a.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return i=n.to,c=n.data,o=n.gas,d=n.gasPrice,g=n.nonce,p=n.value,f=void 0===p?0:p,delete(b=Object(r.a)(Object(r.a)({},n),{},{gasLimit:n.gasLimit||n.gas,chainId:s})).from,delete b.gas,h={nonce:g,gasLimit:o||n.gasLimit,gasPrice:d,to:i,value:f,data:c||"",signerPath:[2147483692,2147483708,l,0,0],chainId:s,useEIP155:!0},v={currency:"ETH",data:h},e.next=8,new Promise((function(e,n){t.sign(v,(function(t,r){if(t)n(t);else{if(!r)throw new Error("Lattice could not sign the message.");delete b.v;var s=Object(u.a)(b,{r:"0x"+r.sig.r,s:"0x"+r.sig.s,v:r.sig.v[0].toString(16)});e({serializedSigned:s,errSignTxn:!1})}}))})).catch((function(e){return console.error(e),{serializedSigned:null,errSignTxn:e}}));case 8:return e.abrupt("return",e.sent);case 9:case"end":return e.stop()}}),e)})));return function(t,n,r){return e.apply(this,arguments)}}()},688:function(e,t){},689:function(e,t){},690:function(e,t){},691:function(e,t){},693:function(e,t){},694:function(e,t){},695:function(e,t){},709:function(e,t){}}]);
//# sourceMappingURL=18.bcbcce3b.chunk.js.map