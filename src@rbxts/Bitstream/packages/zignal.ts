/*
* The Zignal module was originally created by Z0SC. You can find the original repository on GitHub:
* Zignal.luau: https://github.com/Z0SC/Zignal
* 
* SORRY IF THE PORT ISN'T PERFECT, BUT I DID MY BEST, SO PLEASE NO CRITICISM.
*/ 

// A type that represents the result returned by coroutine.yield, at least as accurately as possible for Zignal.
type yieldResult = {
    func : (...args : unknown[]) => void;
    thread : thread;
    packedArgs : unknown[];
}

// A type representing the elements passed when creating a Zignal. Note: only consider the function itself.
type connectionConstructorsArgs<A extends unknown & Array<unknown>> = {
    __func : (...args : A) => void,
    __next? : IConnection<A>,
    __previous : IConnection<A>
}

const threads : thread[] = []

function Call(parameters : yieldResult) : void {
    parameters.func(...parameters.packedArgs)
    table.insert(threads,parameters.thread)
} 

function Yield() : void {
    while (true) {
		const values = coroutine.yield() as LuaTuple<unknown[]>;

		const func = values[0] as (...args: unknown[]) => void;
		const thread = values[1] as thread;

		const packedArgs = table.create<unknown>(values.size() - 2);
		table.move(values, 3, values.size(), 1, packedArgs);

		Call({
			func,
			thread,
			packedArgs,
		});
    }
}

// Simply export the interface of the Signal class.
export interface ISignal<A extends unknown & Array<unknown>> {
    Fire(...args : A) : void;
    Wait() : A;
    Once(func : (...args : A) => void) : Connection<A>;
    Connect(func : (...args : A) => void) : Connection<A>;
    DisconnectAll() : void;
    _next? : Connection<A>
}

// Simply export the interface of the Connection class.
export interface IConnection<A extends unknown & Array<unknown>> {
    Connected : boolean;
    Disconnect() : void;
    _function? : (...args : A) => void;
    _next? : IConnection<A>;
    _previous? : IConnection<A>
}

/* 
* `@Class: Signal`
*
* A class that allows you to create signals. Example:
* ```ts
* let signal = new Signal();
* let typedSignal new Signal<[number,number]>();
* ```
*/
export class Signal<A extends unknown & Array<unknown>> implements ISignal<A> {

    /*
    * Sends the arguments to all connected listeners. If a connection is established,-
    * the callback function is invoked with the arguments passed to Fire.
    */
    public Fire(...args : A) {
        let link = this._next
        while(link) {
            let length = threads.size()
            let __thread = undefined
            if(length === 0) {
                __thread = coroutine.create(Yield)
                coroutine.resume(__thread)
            }
            else {
                __thread = threads[length - 1]
                threads.remove(length - 1)
            }
            task.spawn(__thread,link._function,__thread,...args)
            link = link._next
        }
    }

    /*
    * Yields until Fire is called. Once Fire is called, Wait resumes and returns the arguments passed to Fire.
    */
    public Wait() : A {
        let thread = coroutine.running()
        let connection : unknown = undefined
        connection = this.Connect((...args : A) => {
            (connection as IConnection<A>).Disconnect()
            if(coroutine.status(thread) === "suspended") task.spawn(thread,...args);
        })
        const values = coroutine.yield() as LuaTuple<unknown[]>;
        return (values as unknown[]) as A
    }

    /*
    * Establishes a one-time connection. 
    * The callback function is invoked only once when Fire is called and will not be invoked on subsequent calls to Fire.
    */
    public Once(func : (...args : A) => void) : Connection<A> {
       let connection : unknown
       connection = this.Connect((...args : A) => {
        (connection as Connection<A>).Disconnect()
        func(...args)
       })
       return connection as Connection<A>
    }


    /* 
    * Establishes a connection and returns a Connection<A> instance,-
    * allowing Disconnect to be called at any time to terminate the connection.
    */
    public Connect(func : (...args : A) => void) : Connection<A> {
        let _next_ = this._next
        let link = {
            Connected : true,
            _previous : this,
            _function : func,
            _next : _next_,
        } as unknown
        if(_next_) _next_._previous = link as IConnection<A>;
        this._next = link as IConnection<A>
        return new Connection<A>({
            __func : func,
            __previous : (link as IConnection<A>)._previous,
            __next : (link as IConnection<A>)._next      
        } as connectionConstructorsArgs<A>)
    }

    // Disconnects all existing connections.
    public DisconnectAll(): void {
        let link = this._next
        while(link) {
            link.Connected = false
            link = link._next
        }
        this._next = undefined
    }

    public _next?: Connection<A> | undefined;

}

/* 
* @Class: Connection
*
* A class instantiated when Signal.Connect is called. 
* Its main purpose is to disconnect the connection when Disconnect is called. 
* The constructor is not particularly important to look at.
*/
class Connection<A extends Array<unknown>> implements IConnection<A> {

    public Connected: boolean = false;

    constructor(parameters : connectionConstructorsArgs<A>) {
        this._function = parameters.__func
        this._previous = parameters.__previous
        this._next = parameters.__next
        this.Connected = true
    }

    /*
    * Disconnect the current connection. 
    * This same connection can be reassigned if you use Signal.Connect again later.
    */
    public Disconnect(): void {
        if(this.Connected) this.Connected = false;
        let [_next_,_previous_] = [this._next,this._previous]
        if(_next_) _next_._previous = _previous_;
        (_previous_ as IConnection<A>)._next = _next_
    }

    public _next?: IConnection<A> | undefined;
    public _previous?: IConnection<A> | undefined;
    public _function?: ((...args: A) => void) | undefined;

}