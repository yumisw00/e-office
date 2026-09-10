import ReactPaginate from "react-paginate";
import InputSelect from "./InputSelect";
import { getStorage } from "pages/Utils";

const Pagination = (props) => {
  if (props.paginate.total_records) {
    return props.paginate.total_records <= props.paginate.pagesize ? null : (
      <div
        style={{
          width: "100%",
          height: "auto",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 10,
          marginBottom: 40,
        }}
      >
        <div className="" style={{ fontWeight: "normal" }}>
          Total Data: {props.paginate.total_records} {props.is_loading ? 'Loading...' : ''}
        </div>
        {/* <div
                    style={{
                        display: 'flex', flexDirection: 'row',
                        alignItems: 'center',
                    }}
                >
                    <span>Perhalaman</span>
                    <div></div>
                    <span>Menampilkan 1 sampai 10 dari total {props.paginate.total_records} data</span>
                </div> */}
        {/* {console.log(props.paginate.total_records)}
        {console.log(props.paginate.pagesize)} */}

        {props.onChangePageSize ? (
          <>
            <div className="ps-4">
              Per Page
            </div>
            <div style={{ width: 100 }}>
              <InputSelect
                ref={null}
                id=''
                type='select'
                placeholder={'Pilih...'}
                className='block mt-1 w-full'
                data={[
                  { label: '10', value: 10 },
                  { label: '20', value: 20 },
                  { label: '50', value: 50 },
                  { label: '100', value: 100 },
                ]}
                required={false}
                isClearable
                isMulti={false}
                value={props.pagesize}
                onChange={props.onChangePageSize}
                message_error={null}
                onError={() => null}
                disabled={false}
              />
            </div>
          </>
        ) : null}

        <div style={{ flex: 1 }}>
          <ReactPaginate
            // initialPage={props.is_page_saved ? ((JSON.parse(getStorage('filter')))[props.is_page_saved][this.typeRcm].page || 1) - 1 : null}
            previousLabel="prev"
            nextLabel="next"
            breakClassName="break-me"
            // pageCount={Math.ceil(total_records / 10)}
            pageCount={Math.ceil(
              props.paginate.total_records / props.paginate.pagesize
            )}
            marginPagesDisplayed={2}
            pageRangeDisplayed={2}
            onPageChange={props.onPageClick}
            containerClassName="pagination-view"
            activeClassName="pagination-active"
          />
        </div>
      </div>
    );
  }
  return null;
};

export default Pagination;
