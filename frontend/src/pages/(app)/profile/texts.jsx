<FormGroup
label={"Atribut Kontrol"}
required={false}
message_error={this.state.errors.atribut_kontrol}
disabled={this.state.is_disabled}
>
<div className="col">

    <InputMultiple
        ref={null}
        id='atribut_kontrol'
        type='text'
        placeholder={'Isi Atribut Kontrol...'}
        className='block mt-1 w-full'
        required={false}
        value={''}
        onChange={(value, idx) => {
            this.state.other_state.diatribut_kontrol.map((m, i) => {
                if (i == idx) {
                    m.value = value
                }
            })
            this.setState(state => ({
                other_state: {
                    ...state.other_state,
                    diatribut_kontrol: this.state.other_state.diatribut_kontrol
                }
            }))
        }}
        message_error={this.state.errors.atribut_kontrol}
        onError={this.handleErrors}
        disabled={this.state.is_disabled}
        data={this.state.other_state.diatribut_kontrol}
        onAdd={() => {
            this.state.other_state.diatribut_kontrol.push({ value: '' })
            this.setState(state => ({
                other_state: {
                    ...state.other_state,
                    diatribut_kontrol: this.state.other_state.diatribut_kontrol
                }
            }))
        }}
        onRemove={idx => {
            let diatribut_kontrol = []
            this.state.other_state.diatribut_kontrol.map((m, i) => {
                if (i != idx) {
                    diatribut_kontrol.push(m)
                }
            })
            this.setState(state => ({
                other_state: {
                    ...state.other_state,
                    diatribut_kontrol
                }
            }))
        }}
    />

</div>
</FormGroup>