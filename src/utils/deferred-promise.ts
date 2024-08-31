export class DeferredPromise<T> {
    public promise: Promise<T>;
    public resolve: (value: T) => void = () => {};

    constructor() {
        this.promise = new Promise<T>((resolve) => {
            this.resolve = resolve;
        });
    }
}
