"use client";

const ProductsDetails = () => {
  return (
    <div className="w-full space-y-8 mb-10">
      {/* Description Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gofarm-green mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-gofarm-orange rounded-full"></span>
          Description
        </h2>
        <div className="prose prose-sm max-w-none text-gray-600">
          <p className="mb-4">
            In ducimus quod sed eum repellendus ea fugiat. Pariatur et illo at
            iure harum. Molestiae a itaque voluptas explicabo praesentium.
            Possimus omnis aut architecto et. Repellendus ab ipsa in non
            doloremque tenetur est doloremque.
          </p>
          <p className="mb-4">
            Quam in facere soluta consequatur voluptatem beatae asperiores. Qui
            quia itaque illo eos quibusdam voluptatem et. Est aut deserunt iste.
            Et ipsum eius ut odit deleniti.
          </p>
          <p>
            Officia praesentium ipsam perferendis possimus ex culpa voluptatem
            dolore. Aut id sit et vitae. Quis unde doloremque quisquam facere.
            In qui eos est voluptatem repudiandae blanditiis consequatur.
          </p>
        </div>
      </div>

      {/* Additional Information Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gofarm-green mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-gofarm-orange rounded-full"></span>
          Additional Information
        </h2>
        <div className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white divide-y divide-gray-200">
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 w-1/3">
                  Weight
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  190 kg
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 w-1/3">
                  Dimensions
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  3 × 72 × 109 cm
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductsDetails;
