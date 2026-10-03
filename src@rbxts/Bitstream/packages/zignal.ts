type yieldResult = {
    func : (...args : unknown[]) => void;
    thread : thread;
    packedArgs : unknown[];
}

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

export interface ISignal<A extends unknown & Array<unknown>> {
    Fire(...args : A) : void;
    Wait() : A;
    Once(func : (...args : A) => void) : Connection<A>;
    Connect(func : (...args : A) => void) : Connection<A>;
    DisconnectAll() : void;
    _next? : Connection<A>
}

export interface IConnection<A extends unknown & Array<unknown>> {
    Connected : boolean;
    Disconnect() : void;
    _function? : (...args : A) => void;
    _next? : IConnection<A>;
    _previous? : IConnection<A>
}

export class Signal<A extends unknown & Array<unknown>> implements ISignal<A> {

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

    public Once(func : (...args : A) => void) : Connection<A> {
       let connection : unknown
       connection = this.Connect((...args : A) => {
        (connection as Connection<A>).Disconnect()
        func(...args)
       })
       return connection as Connection<A>
    }

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

    public DisconnectAll(): void {
        let link = this._next
        while(link) {
            link.Connected = false
            link = link._next
        }
        this._next = undefined
    }

    _next?: Connection<A> | undefined;

}

class Connection<A extends Array<unknown>> implements IConnection<A> {

    public Connected: boolean = false;

    /**
     * 
     */
    constructor(parameters : connectionConstructorsArgs<A>) {
        this._function = parameters.__func
        this._previous = parameters.__previous
        this._next = parameters.__next
        this.Connected = true
    }

    public Disconnect(): void {
        if(this.Connected) this.Connected = false;
        let [_next_,_previous_] = [this._next,this._previous]
        if(_next_) _next_._previous = _previous_;
        (_previous_ as IConnection<A>)._next = _next_
    }

    _next?: IConnection<A> | undefined;
    _previous?: IConnection<A> | undefined;
    _function?: ((...args: A) => void) | undefined;

}