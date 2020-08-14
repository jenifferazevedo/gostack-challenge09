import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });
    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProductByName = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findProductByName;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const idProductList = products.map(product => product.id);
    const orderList = await this.ormRepository.find({ id: In(idProductList) });

    if (idProductList.length !== orderList.length) {
      throw new AppError('Some products are not registered!');
    }
    return orderList;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsData = await this.findAllById(products);
    const updateProducts = productsData.map(productData => {
      const productFind = products.find(
        product => product.id === productData.id,
      );
      if (!productFind) {
        throw new AppError('Product not found');
      }
      if (productData.quantity < productFind.quantity) {
        throw new AppError('There is no such quantity in stock.');
      }
      const newProduct = productData;
      newProduct.quantity -= productFind.quantity;

      return newProduct;
    });

    await this.ormRepository.save(updateProducts);

    return updateProducts;
  }
}

export default ProductsRepository;
