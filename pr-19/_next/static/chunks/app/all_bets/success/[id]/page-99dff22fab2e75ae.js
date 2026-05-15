(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[4467],{8379:()=>{},17046:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>m});var s=a(54568),l=a(39043),r=a(89531),n=a(7620),i=a(39141),o=a(43665);let d=`
from math import floor
from typing import Optional

from hathor.nanocontracts.blueprint import Blueprint
from hathor.nanocontracts.exception import NCFail
from hathor.nanocontracts.types import Context, NCAction, NCActionType, SignedData, public
from hathor.types import Address, Amount, Timestamp, TokenUid, TxOutputScript

Result = str


class InvalidToken(NCFail):
    pass


class ResultAlreadySet(NCFail):
    pass


class ResultNotAvailable(NCFail):
    pass


class WithdrawalNotAllowed(NCFail):
    pass


class DepositNotAllowed(NCFail):
    pass


class TooManyActions(NCFail):
    pass


class TooLate(NCFail):
    pass


class InsufficientBalance(NCFail):
    pass


class InvalidOracleSignature(NCFail):
    pass


class Bet(Blueprint):
    """Bet blueprint with final result provided by an oracle.

    The life cycle of contracts using this blueprint is the following:

    1. [Owner ] Create a contract.
    2. [User 1] \`bet(...)\` on result A.
    3. [User 2] \`bet(...)\` on result A.
    4. [User 3] \`bet(...)\` on result B.
    5. [Oracle] \`set_result(...)\` as result A.
    6. [User 1] \`withdraw(...)\`
    7. [User 2] \`withdraw(...)\`

    Notice that, in the example above, users 1 and 2 won.
    """

    # Total bets per result.
    bets_total: dict[Result, Amount]

    # Total bets per (result, address).
    bets_address: dict[tuple[Result, Address], Amount]

    # Bets grouped by address.
    address_details: dict[Address, dict[Result, Amount]]

    # Amount that has already been withdrawn per address.
    withdrawals: dict[Address, Amount]

    # Total bets.
    total: Amount

    # Final result.
    final_result: Optional[Result]

    # Oracle script to set the final result.
    oracle_script: TxOutputScript

    # Maximum timestamp to make a bet.
    date_last_bet: Timestamp

    # Token for this bet.
    token_uid: TokenUid

    @public
    def initialize(self, ctx: Context, oracle_script: TxOutputScript, token_uid: TokenUid,
                   date_last_bet: Timestamp) -> None:
        if len(ctx.actions) != 0:
            raise NCFail('must be a single call')
        self.oracle_script = oracle_script
        self.token_uid = token_uid
        self.date_last_bet = date_last_bet
        self.final_result = None
        self.total = 0

    def has_result(self) -> bool:
        """Return True if the final result has already been set."""
        return bool(self.final_result is not None)

    def fail_if_result_is_available(self) -> None:
        """Fail the execution if the final result has already been set."""
        if self.has_result():
            raise ResultAlreadySet

    def fail_if_result_is_not_available(self) -> None:
        """Fail the execution if the final result is not available yet."""
        if not self.has_result():
            raise ResultNotAvailable

    def fail_if_invalid_token(self, action: NCAction) -> None:
        """Fail the execution if the token is invalid."""
        if action.token_uid != self.token_uid:
            token1 = self.token_uid.hex() if self.token_uid else None
            token2 = action.token_uid.hex() if action.token_uid else None
            raise InvalidToken(f'invalid token ({token1} != {token2})')

    def _get_action(self, ctx: Context) -> NCAction:
        """Return the only action available; fails otherwise."""
        if len(ctx.actions) != 1:
            raise TooManyActions('only one action supported')
        if self.token_uid not in ctx.actions:
            raise InvalidToken(f'token different from {self.token_uid.hex()}')
        return ctx.actions[self.token_uid]

    @public
    def bet(self, ctx: Context, address: Address, score: str) -> None:
        """Make a bet."""
        action = self._get_action(ctx)
        if action.type != NCActionType.DEPOSIT:
            raise WithdrawalNotAllowed('must be deposit')
        self.fail_if_result_is_available()
        self.fail_if_invalid_token(action)
        if ctx.timestamp > self.date_last_bet:
            raise TooLate(f'cannot place bets after {self.date_last_bet}')
        amount = action.amount
        self.total += amount
        if score not in self.bets_total:
            self.bets_total[score] = amount
        else:
            self.bets_total[score] += amount
        key = (score, address)
        if key not in self.bets_address:
            self.bets_address[key] = amount
        else:
            self.bets_address[key] += amount

        # Update dict indexed by address
        partial = self.address_details.get(address, {})
        partial.update({
            score: self.bets_address[key]
        })

        self.address_details[address] = partial

    @public
    def set_result(self, ctx: Context, result: SignedData[Result]) -> None:
        """Set final result. This method is called by the oracle."""
        self.fail_if_result_is_available()
        if not result.checksig(self.oracle_script):
            raise InvalidOracleSignature
        self.final_result = result.data

    @public
    def withdraw(self, ctx: Context) -> None:
        """Withdraw tokens after the final result is set."""
        action = self._get_action(ctx)
        if action.type != NCActionType.WITHDRAWAL:
            raise DepositNotAllowed('action must be withdrawal')
        self.fail_if_result_is_not_available()
        self.fail_if_invalid_token(action)
        allowed = self.get_max_withdrawal(ctx.address)
        if action.amount > allowed:
            raise InsufficientBalance(f'withdrawal amount is greater than available (max: {allowed})')
        if ctx.address not in self.withdrawals:
            self.withdrawals[ctx.address] = action.amount
        else:
            self.withdrawals[ctx.address] += action.amount

    def get_max_withdrawal(self, address: Address) -> int:
        """Return the maximum amount available for withdrawal."""
        total = self.get_winner_amount(address)
        withdrawals = self.withdrawals.get(address, 0)
        return total - withdrawals

    def get_winner_amount(self, address: Address) -> Amount:
        """Return how much an address has won."""
        self.fail_if_result_is_not_available()
        if self.final_result not in self.bets_total:
            return 0
        result_total = self.bets_total[self.final_result]
        if result_total == 0:
            return 0
        address_total = self.bets_address.get((self.final_result, address), 0)
        percentage = address_total / result_total
        return floor(percentage * self.total)
`;var c=a(51156),f=a(28465),u=a(79748);function m(){let e=(0,u.useParams)(),t=(0,u.useRouter)(),a=(0,n.useCallback)(()=>{e&&e.id&&t.push(`/bet/${e.id}`)},[e,t]);return(0,s.jsx)(s.Fragment,{children:(0,s.jsx)("main",{className:"flex min-h-screen items-center p-6 flex-col justify-center bg-cover bg-papyrus-background",children:(0,s.jsx)(r.Zp,{className:"relative flex items-center bg-cover bg-center rounded-lg shadow-lg max-w-4xl w-full h-auto p-8 sm:p-12 lg:p-16 border border-gray-800",children:(0,s.jsxs)(r.Wu,{className:"w-full flex items-center justify-center flex-col",children:[(0,s.jsxs)("div",{className:"flex flex-row items-center justify-center",children:[(0,s.jsx)(l.$,{text:(0,s.jsx)("h1",{className:"text-5xl font-semibold p-4",children:"Congratulations!"})}),(0,s.jsx)("span",{className:"text-4xl ml-0",children:"\uD83C\uDF89"})]}),(0,s.jsxs)("p",{className:"leading-relaxed mb-6 text-left text-xl mt-8 text-bold text-center",children:["Nano Contract created in just a few minutes! ",(0,s.jsx)("br",{}),"Scroll down to see all the hassle, time and money that you saved!"]}),(0,s.jsxs)("div",{className:"w-full flex justify-center flex-col items-center mt-8",children:[(0,s.jsx)("div",{className:"h-8 w-full rounded-tl-lg rounded-tr-lg bg-[#2F2F2F] max-w-[90%]"}),(0,s.jsxs)(c.F,{className:"w-full max-w-[90%] h-[300px]",type:"always",children:[(0,s.jsx)(i.A,{language:"python",style:o.A,className:"min-w-full",customStyle:{padding:16,paddingTop:0},children:d}),(0,s.jsx)(c.$,{orientation:"horizontal",className:"w-full"})]})]}),(0,s.jsxs)("p",{className:"text-lg w-full text-center mt-12",children:["Now it's time: ",(0,s.jsx)("span",{className:"text-hathor-purple-500 subpixel-antialiased font-semibold",children:"place your bet and have fun.\uD83E\uDD73"})]}),(0,s.jsx)(f.$,{onClick:a,className:"h-12 text-white mt-12 w-48 text-lg subpixel-antialiased font-semibold",children:"Place your bet!"})]})})})})}},25156:()=>{},28465:(e,t,a)=>{"use strict";a.d(t,{$:()=>d});var s=a(54568),l=a(7620),r=a(78347),n=a(91397),i=a(64318);let o=(0,n.F)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",{variants:{variant:{default:"bg-primary text-primary-foreground shadow hover:bg-primary/90",destructive:"bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",outline:"border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",secondary:"bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",ghost:"hover:bg-accent hover:text-accent-foreground",link:"text-primary underline-offset-4 hover:underline"},size:{default:"h-9 px-4 py-2",sm:"h-8 rounded-md px-3 text-xs",lg:"h-10 rounded-md px-8",icon:"h-9 w-9"}},defaultVariants:{variant:"default",size:"default"}}),d=l.forwardRef(({className:e,variant:t,size:a,asChild:l=!1,...n},d)=>{let c=l?r.DX:"button";return(0,s.jsx)(c,{className:(0,i.cn)(o({variant:t,size:a,className:e})),ref:d,...n})});d.displayName="Button"},33165:(e,t,a)=>{Promise.resolve().then(a.bind(a,17046))},39043:(e,t,a)=>{"use strict";a.d(t,{$:()=>l});var s=a(54568);a(7620);let l=({text:e})=>(0,s.jsx)("span",{className:"m-0 text-[#FCB116] font-kuenstler",children:e})},41089:(e,t,a)=>{"use strict";a.d(t,{w:()=>l});var s=a(59575);let l=async e=>{let t=await new Promise(t=>s.txApi.getTransaction(e,t));if(!t.success)throw console.error(t),Error("Request to fullnode failed.");return t}},51156:(e,t,a)=>{"use strict";a.d(t,{$:()=>o,F:()=>i});var s=a(54568),l=a(7620),r=a(99554),n=a(64318);let i=l.forwardRef(({className:e,children:t,...a},l)=>(0,s.jsxs)(r.bL,{ref:l,className:(0,n.cn)("relative overflow-hidden",e),...a,children:[(0,s.jsx)(r.LM,{className:"h-full w-full rounded-[inherit]",children:t}),(0,s.jsx)(o,{}),(0,s.jsx)(r.OK,{})]}));i.displayName=r.bL.displayName;let o=l.forwardRef(({className:e,orientation:t="vertical",...a},l)=>(0,s.jsx)(r.VM,{ref:l,orientation:t,className:(0,n.cn)("flex touch-none select-none transition-colors","vertical"===t&&"h-full w-2.5 border-l border-l-transparent p-[1px]","horizontal"===t&&"h-2.5 flex-col border-t border-t-transparent p-[1px]",e),...a,children:(0,s.jsx)(r.lr,{className:"relative flex-1 rounded-full bg-border"})}));o.displayName=r.VM.displayName},52661:()=>{},64318:(e,t,a)=>{"use strict";a.d(t,{JL:()=>_,Yq:()=>p,_x:()=>x,cn:()=>m,jw:()=>h,op:()=>b});var s=a(9917),l=a(2809),r=a(59575),n=a(82702),i=a(69397),o=a.n(i),d=a(72846),c=a.n(d),f=a(64451),u=a(41089);function m(...e){return(0,l.QP)((0,s.$)(e))}function h(e,t=6){return`${e.substring(0,t)}...${e.substring(e.length-t,e.length)}`}function p(e){let t=e.getMonth()+1,a=e.getDate(),s=e.getHours(),l=e.getMinutes(),r=t<10?`0${t}`:t,n=a<10?`0${a}`:a,i=s<10?`0${s}`:s,o=l<10?`0${l}`:l;return`${r}/${n}, ${i}:${o}`}function _(e){return r.nanoUtils.getOracleBuffer(e,new r.Network(n.pG)).toString("hex")}async function x(e,t){console.log("History: ",e);let a=[],s=0;for(let t=0;t<e.length;t++){let l=e[t],i=new r.NanoContractTransactionParser(l.nc_blueprint_id,l.nc_method,l.nc_address,new r.Network("testnet"),l.nc_args);if("initialize"===l.nc_method||"set_result"===l.nc_method)continue;let d=i.parseArguments(),u=c()(o()(d,{name:"score"}),"parsed","-"),m=l.nc_context.actions.reduce((e,t)=>"bet"===l.nc_method&&"deposit"===t.type?(s+=t.amount,e+t.amount):"withdraw"===l.nc_method&&"withdrawal"===t.type?e+t.amount:e,0);a.push({type:l.nc_method,amount:`${(0,f.prettyValue)(m)} ${n.a7}`,bet:u,id:l.tx_id,timestamp:new Date(1e3*l.timestamp)})}return[s,a]}async function b(e,t=0){if(t>n.An)throw Error("Max retries reached.");let{meta:a}=await (0,u.w)(e);if(a.voided_by.length>0)throw Error("Transaction was voided.");return null!=a.first_block?void console.log("has first block!"):(await new Promise(e=>setTimeout(e,1500)),b(e,t+1))}},82702:(e,t,a)=>{"use strict";a.d(t,{An:()=>x,Bz:()=>c,K5:()=>d,M2:()=>n,Sk:()=>r,T7:()=>l,a7:()=>_,eC:()=>u,k:()=>o,o2:()=>i,pG:()=>m,pi:()=>p,q0:()=>h,yF:()=>f});var s=a(40459);let l="hathor:testnet",r=s.env.NEXT_PUBLIC_PROJECT_ID||"8264fff563181da658ce64ee80e80458",n=s.env.NEXT_PUBLIC_RELAY_URL||"wss://relay.walletconnect.com",i=window.NEXT_PUBLIC_BASE_PATH||"",o=s.env.NEXT_PUBLIC_URL||"http://localhost:3000",d="https://node1.india.testnet.hathor.network/v1a/",c="debug",f={name:"Hathor Bet",description:"Create your Bet Nano Contract",url:o,icons:["https://hathor-public-files.s3.amazonaws.com/hathor-demo-icon.png"]},u="0000019865eda743812c566ce6ad3ac49c5f90796b73aa2792a09b7655ac5a5e",m="testnet",h="https://explorer.india.testnet.hathor.network/",p="00",_="HTR",x=800},89531:(e,t,a)=>{"use strict";a.d(t,{Wu:()=>i,Zp:()=>n,wL:()=>o});var s=a(54568),l=a(7620),r=a(64318);let n=l.forwardRef(({className:e,...t},a)=>(0,s.jsx)("div",{ref:a,className:(0,r.cn)("rounded-xl bg-card text-card-foreground shadow",e,"border"),...t}));n.displayName="Card",l.forwardRef(({className:e,...t},a)=>(0,s.jsx)("div",{ref:a,className:(0,r.cn)("flex flex-col space-y-1.5 p-6",e),...t})).displayName="CardHeader",l.forwardRef(({className:e,...t},a)=>(0,s.jsx)("h3",{ref:a,className:(0,r.cn)("font-semibold leading-none tracking-tight",e),...t})).displayName="CardTitle",l.forwardRef(({className:e,...t},a)=>(0,s.jsx)("p",{ref:a,className:(0,r.cn)("text-sm text-muted-foreground",e),...t})).displayName="CardDescription";let i=l.forwardRef(({className:e,...t},a)=>(0,s.jsx)("div",{ref:a,className:(0,r.cn)("p-6 pt-0",e),...t}));i.displayName="CardContent";let o=l.forwardRef(({className:e,...t},a)=>(0,s.jsx)("div",{ref:a,className:(0,r.cn)("flex items-center p-6 pt-0",e),...t}));o.displayName="CardFooter"},93553:()=>{}},e=>{e.O(0,[4129,3473,3527,5825,587,1968,7358],()=>e(e.s=33165)),_N_E=e.O()}]);